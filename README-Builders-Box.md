# Builder's Box — FlexPath Final Project

** Description: Builder's Box is a full-stack application for managing PC parts and computer builds.

- Login/Logout, Search PC parts, add to public or private builds
- Admin users have access to the Admin Page


## Start the application

** Steps:

1. Start MySQL Workbench and configure/connect database, then open the create-database.sql file at 'database\create-database.sql' and run it.
2. Open the Application Properies at 'backend\src\main\resources\application.properties' and replace the username/password as needed to match the MySQL connection
3. Run the SpringBoot application at 'backend\src\main\java\org\example\SpringBootApplication.java' to start the backend server.
4. Open a terminal and navigate to the /frontend directory and run the npm commands: 'npm run build', then 'npm run dev'.
5. Open a browser and navigate to localhost:5173, login with admin:admin, user:admin, or guest_builder:admin (all passwords are the same for demonstration)


## Run the unit tests

** Backend

1. Open a new Java 17 terminal and navigate to /backend.
2. run the command 'mvn clean verify', then 'mvn test'.

** Frontend

1. Open a new terminal and navigate to /frontend.
2. Run the command npm test