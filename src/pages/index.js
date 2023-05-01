import { createRoot } from 'react-dom/client';


const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});


const App = () => {
  return <>
    <div>
      <span>{params.miLinksFile ?? "no file given"}</span>
    </div>
    <div>
      <a href='alfred://runtrigger/com.milinks.alfred/test/?argument=test'>Trigger alfred</a>
    </div>
    <div>
      <button onClick={
        () => fetch("alfred://runtrigger/com.milinks.alfred/test/?argument=test")
      }>
      Trigger alfred
      </button>
    </div>
  </>
}

const root = createRoot(document.getElementById('app'));
root.render(<App></App>);
