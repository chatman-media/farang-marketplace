import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App">
        <header>
          <h1>Thailand Marketplace</h1>
        </header>
        <main>
          <Routes>
            <Route
              path="/"
              element={<div>Welcome to Thailand Marketplace</div>}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
