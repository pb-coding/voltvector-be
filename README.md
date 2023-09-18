## VoltVector Backend

Backend of my energy management system for users with a Enphase solar system and smart home devices from Meross.
Users can log into this platform, connect their enphase solar energy account and smart home meross account to view energy data production, consumption and control their smart home devices.

Implemented:
- Login with custom JWT Authentification. (Access tokens are not stored in local storage, but in memory only and refresh tokens are sent via protected http only header cookie)
- permission roles & protected routes
- OAuth process to let users connect their solar energy system from Enphase. Importer runs every 15 minutes. A data verification job checking for data consistency once a day.
- Auth process to let users connect and control their Smart Home devices. (Meross does currently not offer any form of oauth process, but user credentials are stored encrypted)
- UI to view and filter energy production and consumption data of their solar system and UI cards to control their smart home devices and view the device level energy consumption.
- Admins can CRUD users via the UI

While the foundation for manual view and control of solar systems and smart home devices is implemented, there is still a lot todo.

TODO:
- more error handling to increase robustness of the platform
- building some kind of automation that controls devices based on prior custom defined priority groups via UI.

Stack:
FE: 
- Typescript
- React
- Next.js 13 with app router
- TailwindCSS (using Flowbite components)

BE: 
- Typescript
- ExpressJS
- Prisma as ORM
- PostgresSQL


![dashboard-overview](https://github.com/pb-coding/voltvector-fe/assets/71174645/8d02ade2-fe63-4c4c-baa1-5e11058190ca)

![device-energy-overview](https://github.com/pb-coding/voltvector-fe/assets/71174645/456b339a-712b-446d-98b8-bdeeee43d1bb)

![image](https://github.com/pb-coding/voltvector-fe/assets/71174645/fcf9edbe-8cd0-4ff2-b2c0-3775488bb142)

![image](https://github.com/pb-coding/voltvector-fe/assets/71174645/8fae1283-0bc2-4227-87d4-637bbe62d2d7)

![image](https://github.com/pb-coding/voltvector-fe/assets/71174645/3b1c45dd-687a-4ffe-ac0e-53e54b82fd19)

![smart-home-auth](https://github.com/pb-coding/voltvector-fe/assets/71174645/a4aab056-7210-4638-b088-a75d03562c59)

![smart-home-devices](https://github.com/pb-coding/voltvector-fe/assets/71174645/36adcd03-6c69-4139-8bde-111c58bc1e75)

![image](https://github.com/pb-coding/voltvector-fe/assets/71174645/fe63c177-d818-49b0-9621-ad089195e6db)

![image](https://github.com/pb-coding/voltvector-fe/assets/71174645/009ad379-00a8-440b-b337-146f03267bfc)

![image](https://github.com/pb-coding/voltvector-fe/assets/71174645/043e1b3b-fec6-4d8b-bca7-e15ca9e111e0)
