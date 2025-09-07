import React from "react"
import { TonConnectUIProvider } from "@tonconnect/ui-react"

function App() {
  const Provider = TonConnectUIProvider as any

  return (
    <Provider manifestUrl="https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json">
      <div className="App">
        <header>
          <h1>TON App - Thailand Marketplace</h1>
        </header>
        <main>
          <div>TON Integration Coming Soon</div>
        </main>
      </div>
    </Provider>
  )
}

export default App
