# DONE

I've started you off with a sveltekit template.
Let's make an app to allow time management for kids for each morning.
There's two modes, one for going through each day's tasks, and one for setup.  

in setup mode:  
  * user sets alert times  
  * under each alert time they can set up checklist items (can be multiple items per alert time) each of which has a name  

in daily checklist mode:  
  * show each checklist item grouped under its time
  * user can check items off the checklist
  * the checklist resets after the last alert time to be ready for the next day.

Don't apply any additional styling yet.

# FUTURE

ROUND 2 

Add styling to the components and pages. Leverage Tailwind where appropriate.

ROUND 3

in daily checklist mode:  
  * add an alert sound that goes off at the specified time, then speak out loud which items need to be done.  
  * If a user has already checked an item off for the day don't announce that item.  
  * If a user checked all the items off for a specific alert time, play a happier alert sound and a fun animation and announce that that time's items are done.
  * The checklist resets after the last alert time to be ready for the next day  
  * The last item in the checklist for the last time of the day is always treated as "day's tasks complete" and is shown in dark green and bold text.   

The default new blank state (when starting the app for the first time) has one item at 7:30 AM titled "ready to leave\!" that functions in that capacity \- although the user can change its name in setup mode if they want.

Keep track in localstorage of the daily checklist and a history of whether the user checked the  last item off ("ready to leave") for each day.

Add a "reset" button in setup mode that will clear the checklist, times and history and reset to a blank state.

ROUND 4 

Also have a button that can show stats for the week / month on how often they've been ready to leave % wise (eg how often they've checked that last checkbox off)

Alerting

* When playing an alert for a given time, besides playing an alert sound, announce the tasks to be done in that time slot with speech synthesis. Use vits-web to do speech synthesis; fallback to native browser speech synthesis if that fails (or if they're using a known unsupported browser like Safari)  
* play a friendly alert sound before speaking the tasks to do at a particular time

THINGS TO DO LATER

* play a different longer friendly alert for the last time on the list  
* show a fun animation and make a happy noise when they check off an item \- confetti or something.

use AI to autosuggest an emoji to show next to each checklist item when setting up.

zazz it up stylistically to be fun for kids