# Maze Factory [<img src="appstore.png" height="50">](https://apps.apple.com/us/app/maze-factory/id6451072154)

Cross-platform mobile application targetting iOS users written in React Native.
Allows users to generate random mazes and share them for others to play and compete for record times.
Hopefully, [these features](#todo) will be available in some time.

Mazes are randomly generated with a runtime complexity of Ω(_n_)/O(_n_<sup>2</sup>) (where _n_ is the number of spaces in the maze)
using an [original algorithm](src/models/maze.ts#L153) based on a bottom-up tree-building approach.

View a demo video of an older development build [here](https://youtu.be/95CQar_Gtes)!

## Run your own development server

You will need an [active Google account](https://support.google.com/accounts/answer/27441?hl=en)
and [Node.js and npm installed](https://nodejs.org/en/download).

### Configure Firebase project

1. Create a project at [https://console.firebase.google.com](https://console.firebase.google.com).
2. Select your project in the Firebase Console.
3. Enable email and password authentication:
   * Click on "Authentication" on the left side navigation menu under the "Build" product category.
   * Click on the "Sign-in method" tab.
   * Enable the "Email/Password" sign-in provider.
4. Enable Cloud Firestore:
   * Click on "Firestore Database" on the left side navigation menu under the "Build" product category.
   * Click on the "Create database" button.
   * Choose the "Start in production mode" option and enable the database.
5. Select a paid plan* to enable Cloud Functions:
   * Click on "Functions" on the left side navigation menu under the "Build" product category.
   * Click on the "Upgrade project" button.
   * Select a plan of your choice (the Blaze plan is recommended).
6. Add your project's credentials to the app:
   * Click on "Project Overview" on the left side navigation menu.
   * Add a new application. For running a development server with Expo, selecting "web" as the platform is fine.
   * Set an app nickname and register it.
   * Instructions on how to add the Firebase SDK will become visible. The code block will, among some other JavaScript code, contain the declaration displayed below. Copy the config object (the code beginning with `{` and ending in `}`).

```
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id"
};
```
*Note: you will not be charged for up to 2M invocations/month,
which you will not come close to with a bit of experimentation with the repository.

### Configure Expo project

Clone this repository:

```
git clone https://github.com/dviggiano/maze-factory.git
```

Navigate to the project directory and register the project with your Firebase project.

```
cd maze-factory
npm install -g firebase-tools # install Firebase CLI
firebase login # log into Firebase
```

Add a file to the root directory called `.firebaserc`. Include the following:

```
{
  "projects": {
    "default": "your-project-id"
  }
}
```

Replace `your-project-id` with the `projectId` field from the JavaScript object you copied earlier.

Add a file to the `src/firebase` directory called `credentials.json`. Fill it with the JavaScript object you copied earlier,
but add double quotes (`"`) around the object's keys. For example:

```
{
  "apiKey": "your-api-key",
  "authDomain": "your-auth-domain",
  "projectId": "your-project-id",
  "storageBucket": "your-storage-bucket",
  "messagingSenderId": "your-messaging-sender-id",
  "appId": "your-app-id",
  "measurementId": "your-measurement-id"
}
```

Finally, run the following commands to install necessary packages and configure your serverless functions and database:

```
npm install # install necessary packages
cd functions
npm install # install necessary packages for serverless functions
npm run deploy # deploy cloud functions
cd ..
npm run setup # configure database
```

You are finally all set to run your development server:

```
npm run start
```

Download the [Expo Go iOS app](https://apps.apple.com/us/app/expo-go/id982107779) and scan the provided QR code for an optimized demonstration.

# TODO

## Assets

* Loading icon
* Music
* Go whistle
* Completion sound
* Confetti on record

## Features and functionality

* Prompt users to rate the app
* Replace native alerts with custom modals that match the rest of the app
* Allow users to share mazes via text, etc.
* Deliver a push notification when someone sets a record on your maze or beats your record
* Add accessibility features including dictation
* Improve UI during loading (blur text...etc.)

## Codebase

* Universally utilize type-checking
* Ensure uniform styling
* Extract reused components
* Complete documentation
* Implement test suite

## Bug Fixes

* None - please report issues [here](https://github.com/dviggiano/maze-factory/issues)!
