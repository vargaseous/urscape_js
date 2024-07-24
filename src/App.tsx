import { useEffect } from 'react';
import { configure, spy } from 'mobx';
import { StoreProvider, store } from './Stores/RootStore';

import Map from './Map';
import Gui from './GUI/Gui';

import './App.css';

function App() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      configure({
        enforceActions: "always"
      });

      return spy(event => {
        if (event.type === "action" && !event.name.startsWith("updateMap")) {
          console.debug("[mobx event]", event.name, ...event.arguments);
        }
      });
    }
  }, []);

  return (
    <StoreProvider value={store}>
      <Map />
      <Gui />
    </StoreProvider>
  )
}

export default App;
