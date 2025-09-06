import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  const RouterComponent = Router as any;
  const RoutesComponent = Routes as any;
  const RouteComponent = Route as any;

  return (
    <RouterComponent>
      <div className="App">
        <header>
          <h1>Admin Panel - Thailand Marketplace</h1>
        </header>
        <main>
          <RoutesComponent>
            <RouteComponent path="/" element={<div>Admin Dashboard</div>} />
          </RoutesComponent>
        </main>
      </div>
    </RouterComponent>
  );
}

export default App;
