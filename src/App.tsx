import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <div role="tablist" className="tabs tabs-bordered">
        <input type="radio" name="my_tabs_1" role="tab" className="tab" aria-label="Tab 1" />
        <div role="tabpanel" className="tab-content p-10">Tab content 1</div>
        <input
          type="radio"
          name="my_tabs_1"
          role="tab"
          className="tab"
          aria-label="Tab 2"
          defaultChecked />
        <div role="tabpanel" className="tab-content p-10">Tab content 2</div>

        <input type="radio" name="my_tabs_1" role="tab" className="tab" aria-label="Tab 3" />
        <div role="tabpanel" className="tab-content p-10">Tab content 3</div>
      </div>

      <button className="btn btn-primary">Button</button>
    </>
  )
}

export default App
