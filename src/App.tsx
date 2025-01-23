import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Button, Card, Input, Checkbox } from 'react-daisyui';
import * as tts from 'https://cdn.jsdelivr.net/npm/@diffusionstudio/vits-web@1.0.3/+esm';

const DEFAULT_SCHEDULE = {
  timeBlocks: [],
  completionHistory: []
};

const VOICE = "en_US-amy-medium";

const App = () => {
  const [currentTab, setCurrentTab] = useState('daily');
  const [currentSchedule, setCurrentSchedule] = useState(JSON.parse(localStorage.getItem('kidSchedule')) || DEFAULT_SCHEDULE);
  const [activeAlerts, setActiveAlerts] = useState(new Set());

  useEffect(() => {
    const voices = await tts.stored();
    if (!voices.includes(VOICE)) {
      await tts.download(VOICE, (progress) => {
        console.log(`Downloading ${progress.url} - ${Math.round(progress.loaded * 100 / progress.total)}%`);
      });
    } else {
      console.log('Voice already loaded');
    }

    const interval = setInterval(checkAndTriggerAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const saveAndRender = () => {
    localStorage.setItem('kidSchedule', JSON.stringify(currentSchedule));
    setCurrentSchedule({ ...currentSchedule });
  };

  const addTimeBlock = () => {
    const timeBlock = {
      time: '',
      items: ['']
    };
    currentSchedule.timeBlocks.push(timeBlock);
    saveAndRender();
  };

  const updateTime = (index, value) => {
    currentSchedule.timeBlocks[index].time = value;
    saveAndRender();
  };

  const addChecklistItem = (blockIndex) => {
    currentSchedule.timeBlocks[blockIndex].items.push('');
    saveAndRender();
  };

  const updateChecklistItem = (blockIndex, itemIndex, value) => {
    currentSchedule.timeBlocks[blockIndex].items[itemIndex] = value;
    saveAndRender();
  };

  const removeChecklistItem = (blockIndex, itemIndex) => {
    currentSchedule.timeBlocks[blockIndex].items.splice(itemIndex, 1);
    saveAndRender();
  };

  const removeTimeBlock = (blockIndex) => {
    currentSchedule.timeBlocks.splice(blockIndex, 1);
    saveAndRender();
  };

  const toggleChecklistItem = (timeIndex, itemIndex) => {
    const block = currentSchedule.timeBlocks[timeIndex];
    const item = block.items[itemIndex];

    if (!block.completed) {
      block.completed = new Set();
    }

    if (block.completed.has(itemIndex)) {
      block.completed.delete(itemIndex);
    } else {
      block.completed.add(itemIndex);
    }

    if (timeIndex === currentSchedule.timeBlocks.length - 1 && itemIndex === block.items.length - 1) {
      recordCompletion(block.completed.has(itemIndex));
    }

    if (block.completed.size === block.items.length) {
      activeAlerts.delete(timeIndex);
    }

    saveAndRender();
  };

  const recordCompletion = (completed) => {
    const today = new Date().toISOString().split('T')[0];
    currentSchedule.completionHistory.push({
      date: today,
      completed: completed
    });
  };

  const checkAndTriggerAlerts = () => {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    currentSchedule.timeBlocks.forEach((block, index) => {
      if (block.time === currentTime && !activeAlerts.has(index)) {
        if (!block.completed || block.completed.size !== block.items.length) {
          activeAlerts.add(index);
          speakAlert(block);
        }
      }
    });
  };

  const speakAlert = async (block) => {
    const uncompletedItems = block.items.filter((item, index) => !block.completed || !block.completed.has(index));

    if (uncompletedItems.length > 0) {
      const date = new Date();
      const options = { hour: '2-digit', minute: '2-digit' };
      const formattedTime = date.toLocaleTimeString([], options);

      const message = `It's ${formattedTime}. Time to ${uncompletedItems.join(', and ')}`;

      const wav = await tts.predict({
        text: message,
        voiceId: VOICE,
      });

      const audio = new Audio();
      audio.src = URL.createObjectURL(wav);
      audio.play();
    }
  };

  const calculateStats = () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const weeklyCompletions = currentSchedule.completionHistory.filter(record => new Date(record.date) >= weekAgo);
    const monthlyCompletions = currentSchedule.completionHistory.filter(record => new Date(record.date) >= monthAgo);

    const weeklyRate = weeklyCompletions.length > 0 ? (weeklyCompletions.filter(r => r.completed).length / weeklyCompletions.length * 100).toFixed(1) : 0;
    const monthlyRate = monthlyCompletions.length > 0 ? (monthlyCompletions.filter(r => r.completed).length / monthlyCompletions.length * 100).toFixed(1) : 0;

    return { weeklyRate, monthlyRate };
  };

  return (
    <div className="container mx-auto p-4">
      <Tabs value={currentTab} onChange={setCurrentTab}>
        <Tab value="daily" label="Daily Tasks">
          <DailyTasks
            currentSchedule={currentSchedule}
            activeAlerts={activeAlerts}
            toggleChecklistItem={toggleChecklistItem}
          />
        </Tab>
        <Tab value="setup" label="Setup">
          <Setup
            currentSchedule={currentSchedule}
            addTimeBlock={addTimeBlock}
            updateTime={updateTime}
            addChecklistItem={addChecklistItem}
            updateChecklistItem={updateChecklistItem}
            removeChecklistItem={removeChecklistItem}
            removeTimeBlock={removeTimeBlock}
          />
        </Tab>
        <Tab value="stats" label="Stats">
          <Stats calculateStats={calculateStats} />
        </Tab>
      </Tabs>
    </div>
  );
};

export default App;
