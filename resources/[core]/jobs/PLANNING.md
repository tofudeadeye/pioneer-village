# Job System

This document is located at:
resources/[core]/jobs/PLANNING.md

# Project Information

- resource path you will be working in these folders:
  - resources/[core]/jobs
  - socket/src/
  - you will primarily be in the following file:
    - socket/src/controllers/jobs.ts
  - but you can edit others as necessary to properly integrate it into the rest of the socket system
- ui path you will be working in these folders:
  - resources/ui/src/ui/app
  - you can additionally only do the two following:
    1. to create a new layer in the app/layers folder (you can look at the log layer for an example)
    2. to create a new controller in the app/controllers folder
    3. update any necessary types in any *.d.ts files
    4. you can only review these files:
       - lib/client/comms/ui.ts
       - resources/ui/src/types.d.ts
       - resources/ui/src/client/types.d.ts
       - A couple of example resources would be in:
         - resources/[core]/init/src/
         - resources/[core]/doors/src/

# Overal Goals

- Create a job system that facilitates the management of jobs within the game.
- It should allow other resources to easily create jobs and manage them.
- The system should be flexible enough to accommodate various types of jobs and their specific requirements.
- The system should allow for hooks/callbacks/events to be triggered at various stages of job (e.g., clock in/out, task started, payout).
- Be sure to use the PVBase, PVGame, and PV**** helpers where appropriate.
- The overall goal of this resource is to be a core job management resource.
  - The plan is to have separate resources be able to use this system to manage jobs in general.
  - Like a Sherriff job:
    - Needs Clock In/Out (these might be locked to a specific location)
    - Document Storage
    - Always open tasks (ex. Maybe payment happens per arrest and arrests can just happen whever)
    - Remember do not make this sherriff job it is just a few ideas
  - Like a Saloon job:
    - Needs Clock In/Out
    - Task Generation (ex. This resource might genereate random dirty tables to clean and send the task to a job system event/callback)
    - Maybe a commission on item sale (this may not need a job hook for commision. Might just need like a payout from job bank)
    - Remember do not make this saloon job it is just a few ideas
  - Job pay may or may not be on the fly. We don't currently have a fully fleshed out bank system for money. So just assume there is like a PVBank resource that has some exports for removing/adding money to a bank system. Leave the PVBank calls commented where they would ideally be with expected inputs/outputs. Also for sake of sanity add a TODO comment long with a hard coded version in place so the code just works.
  - Clocking in/out might need some special constraints like can only clock in during certain hours or at a certain location.
  - Socket Controller:
    - The socket controller is located in the socket/src/controllers/jobs.ts file.
    - The socket controller will likely make up the bulk of the job logic code.
    - The socket controller should be handling all the verification checks needed. (ex. Check out the inventory controller for an idea of how things are handled)
    - The socket controller should keep track of the state and restore it on server start and send any client state necessary on client connect.
    - Character ID Allow/Block list helper functions and storage (ex. Job Permissions Table, with characterId, type, typeId. ex. 4, job, sherriff meaning that characterId:4 can do jobHandle:sherrif. ex. 3, task, clean-table meaning that characterId:3 can do taskHandle:clean-table)
    - Clock In/Out
    - Task Management
      - Creation
      - Assignment
      - Progress Tracking
      - Completion
    - etc...
  - Client Resource:
    - The resources/[core]/jobs/src/client will be code that is running on the game client.
    - Should hook into commands or the target system to allow job interactions.
    - Should provide a UI for the job management.
    - Resources like a sherriff job should be able to provide their own UI for job management as well so allow a callback/event for triggering from the job resource if necessary.
  - Server Resource:
    - The resources/[core]/jobs/src/server folder should only handle FXServer logic.
    - Server logic not specific to FXServer should be placed in the socket/src/controllers/jobs.ts file.
    - You will most likely not need to add anything for the FXServer in the server resource.

# Feature Goals
- Businesses / Jobs
  - Name
  - Description
  - Payment Type (e.g., hourly, per task, etc.)
  - Payment Amount (e.g., hourly rate, per task rate, callback for dynamic payment, etc.)
  - Requirements (e.g., skills, licenses, etc.)
  - Inventory (e.g., tools, uniforms, etc.)
  - Tasks
    - Task Name
    - Task Description
    - Task Type (e.g., delivery, collection, guarding, etc.)
    - Task Requirements (e.g., wagon, horse, tools, etc.)
    - Task Rewards (e.g., money, items, etc.)
- Employees
  - Database of Employees that consist of Character Ids, Position, Salary, and other relevant information.
  - Ability to clock in/out of jobs.
  - Ability to assign tasks to employees.
  - Ability to track task progress and completion.
  - Ability to pay employees based on their job type and task completion.
