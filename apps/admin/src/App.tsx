import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App">
        <header>
          <h1>Admin Panel - Thailand Marketplace</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<div>Admin Dashboard</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
