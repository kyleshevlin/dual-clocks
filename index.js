import * as React from "react";
import { render } from "react-dom";

const INTERVAL = 1000;
const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;

render(<App />, document.getElementById("app"));

function App() {
  const [time1, timerState1, handlers1] = useTimer();
  const [time2, timerState2, handlers2] = useTimer();

  return (
    <div className="wrap">
      <Button
        onClick={() => {
          handlers1.stop();
          handlers2.stop();
        }}
      >
        Stop All
      </Button>
      <Button
        onClick={() => {
          handlers1.reset();
          handlers2.reset();
        }}
      >
        Reset All
      </Button>

      <div className="time">{formatTime(time1)}</div>
      <div className="time">{formatTime(time2)}</div>

      <Button
        disabled={timerState1 === "RUNNING"}
        onClick={() => {
          handlers1.start();
          handlers2.stop();
        }}
      >
        Left
      </Button>
      <Button
        disabled={timerState2 === "RUNNING"}
        onClick={() => {
          handlers1.stop();
          handlers2.start();
        }}
      >
        Right
      </Button>
    </div>
  );
}

function useTimer(initialState = 0) {
  const intervalId = React.useRef();
  const [time, setTime] = React.useState(0);
  const [timerState, setTimerState] = React.useState("STOPPED");

  const start = React.useCallback(() => {
    intervalId.current = setInterval(() => {
      setTime((s) => s + INTERVAL);
    }, INTERVAL);
  }, []);

  React.useEffect(() => {
    if (timerState === "RUNNING" && !intervalId.current) {
      start();
    }

    if (timerState === "STOPPED" && intervalId.current) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }

    return () => clearInterval(intervalId.current);
  }, [timerState]);

  const handlers = React.useMemo(
    () => ({
      start: () => {
        setTimerState("RUNNING");
      },
      stop: () => {
        setTimerState("STOPPED");
      },
      reset: () => {
        setTime(0);

        // If the timer is reset while running, we want to stop
        // the current interval and restart it so that it takes
        // roughly a full second for each tick, instead of the first
        // tick coming whenever the previous interval fires.
        if (timerState === "RUNNING" && intervalId.current) {
          clearInterval(intervalId.current);
          start();
        }
      },
    }),
    [start, timerState]
  );

  return [time, timerState, handlers];
}

function zeroPad(num) {
  return String(num).padStart(2, "0");
}

function formatTime(ms) {
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (ms >= HOUR) {
    hours = Math.floor(ms / HOUR);
    ms = ms % HOUR;
  }

  if (ms >= MINUTE) {
    minutes = Math.floor(ms / MINUTE);
    ms = ms % MINUTE;
  }

  if (ms >= SECOND) {
    seconds = Math.floor(ms / SECOND);
  }

  return `${zeroPad(hours)}:${zeroPad(minutes)}:${zeroPad(seconds)}`;
}

function Button({ children, disabled = false, onClick }) {
  return (
    <button
      className="button"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
