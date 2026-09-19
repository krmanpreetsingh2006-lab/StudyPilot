# StudyPilot 🚀

Adaptive AI Study Planner for Students.

## Features
- Firebase Email/Password authentication
- Firestore subject and task storage
- Daily task checklist
- Progress tracking
- Adaptive-plan button ready for further rescheduling logic

## Setup
1. Create a Firebase project.
2. Enable Authentication → Email/Password.
3. Create a Firestore Database.
4. Register a Web App in Firebase.
5. Copy its config into `app.js`.
6. For a quick local run, use VS Code Live Server.
7. Deploy using Firebase Hosting if desired.

## Hackathon submission
Title: StudyPilot – An Adaptive AI-Powered Study Planner

Description:
StudyPilot helps students create and track personalized study plans based on subjects, topics, exam dates and available study time. It stores student data securely using Firebase and adapts the plan when tasks are completed or missed.

## Important
Do not put a Gemini/OpenAI secret API key directly in frontend JavaScript. If AI is added, use a secure backend/serverless function.
