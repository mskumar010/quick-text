# Quick Text (formerly ShareText)

Quick Text is a real-time text sharing application. It allows users to instantly share and view text snippets across devices.

## Features

- Real-time text updates.
- Simple and fast interface.
- Client-side routing for viewing messages.

## Tech Stack

- **Frontend**: React, Vite
- **Backend**: Node.js, Express, Socket.io (if used, else logic is in place for future)
- **Deployment**: Render

## Local Development

1. **Install Dependencies**

   ```bash
   npm install --prefix client
   npm install --prefix server
   ```

2. **Start Development Server**
   - Frontend:
     ```bash
     npm run dev --prefix client
     ```
   - Backend:
     ```bash
     node server/server.js
     ```

## Deployment (Render)

This project is configured for deployment on Render.

- **Build Command**: `npm run build`
  - This installs dependencies for both client and server, and builds the React app.
- **Start Command**: `npm start`
  - This starts the Express server which serves the built React app.

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
