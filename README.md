# Maze Factory

Cross-platform application targetting mobile users written in React Native. Allows users to generate random mazes and share them for others to play and compete for record times. Solo entry for MadHacks 2023 - thank you MadHacks! Currently working on implementing features listed below.

Mazes are randomly generated using an original algorithm: the "Leaves Up" tree-building approach. Check it out <a href="/maze/Maze.ts#L221">here</a>.

## Getting Started

To run the development build, clone the repository and create a `credentials.json` file to store Firebase API credentials. Then run:

```
npm install
npm start
```

# TODO

## Improvements

### Codebase

* Handle errors for all async events
* Move Firebase operations to hidden backend or serverless proxy
* Clean up codebase; universally utilize type-checking, ensure uniform styling, complete documentation
* Add app icons and other necessary files for deployment

### Features

* Improve error messages on authentication screen
* Improve maze menu to allow for searching, sorting, filtering, etc.
* Allow users to share their record times or published mazes via social media
* Add accessibility features including dictation
* Redesign maze builder to handle more functionality, like drawing and setting colors

## Bug Fixes

* None as of right now!
