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

      <Time
        editDisabled={timerState1 === "RUNNING"}
        time={time1}
        update={handlers1.update}
      />
      <Time
        editDisabled={timerState2 === "RUNNING"}
        time={time2}
        update={handlers2.update}
      />

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

function useTimer() {
  const intervalId = React.useRef();
  const [{ time }, setTime] = React.useState({
    time: 0,
    lastUpdate: null,
  });
  const [timerState, setTimerState] = React.useState("STOPPED");

  const startInterval = React.useCallback(() => {
    setTime((s) => {
      if (!s.lastUpdate) {
        return { ...s, lastUpdate: Date.now() };
      }

      return s;
    });

    intervalId.current = setInterval(() => {
      setTime((s) => {
        const now = Date.now();
        const delta = now - s.lastUpdate;

        return {
          time: s.time + delta,
          lastUpdate: now,
        };
      });
    }, INTERVAL);
  }, []);

  React.useEffect(() => {
    if (timerState === "RUNNING" && !intervalId.current) {
      startInterval();
    }

    if (timerState === "STOPPED" && intervalId.current) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }

    return () => clearInterval(intervalId.current);
  }, [startInterval, timerState]);

  const handlers = React.useMemo(
    () => ({
      start: () => {
        setTimerState("RUNNING");
      },
      stop: () => {
        setTime((s) => ({ ...s, lastUpdate: null }));
        setTimerState("STOPPED");
      },
      update: (value) => {
        const ms = convertValueToMilliseconds(value);
        setTime((s) => ({ time: ms, lastUpdate: null }));
        setTimerState("STOPPED");
      },
      reset: () => {
        setTime({ time: 0, lastUpdate: null });

        // If the timer is reset while running, we want to stop
        // the current interval and restart it so that it takes
        // roughly a full second for each tick, instead of the first
        // tick coming whenever the previous interval fires.
        if (timerState === "RUNNING" && intervalId.current) {
          clearInterval(intervalId.current);
          startInterval();
        }
      },
    }),
    [startInterval, timerState]
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

function convertValueToMilliseconds(value) {
  const [hours, minutes, seconds] = value
    .split(":")
    .map((x) => parseInt(x, 10));
  return hours * HOUR + minutes * MINUTE + seconds * SECOND;
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

function Time({ editDisabled, time, update }) {
  const [state, setState] = React.useState("IDLE");

  const handleUpdate = React.useCallback((hours, minutes, seconds) => {
    update(`${hours}:${minutes}:${seconds}`);
    setState("IDLE");
  });

  let inner;
  if (state === "EDITING") {
    inner = (
      <TimeInput
        time={formatTime(time)}
        onUpdate={handleUpdate}
        onCancel={() => {
          setState("IDLE");
        }}
      />
    );
  }

  if (state === "IDLE") {
    inner = (
      <>
        <div
          style={{
            fontSize: "2rem",
            textAlign: "center",
            paddingLeft: "2rem",
            paddingRight: "2rem",
          }}
        >
          {formatTime(time)}
        </div>
        <Button
          disabled={editDisabled}
          onClick={() => {
            setState("EDITING");
          }}
        >
          Edit
        </Button>
      </>
    );
  }

  return (
    <div style={{ display: "flex", gap: "1rem", padding: "0 1rem" }}>
      {inner}
    </div>
  );
}

function TimeInput({ onCancel, onUpdate, time }) {
  const [hours, minutes, seconds] = time.split(":");
  const [val1, setVal1] = React.useState(hours);
  const [val2, setVal2] = React.useState(minutes);
  const [val3, setVal3] = React.useState(seconds);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center" }}>
        <TimeSingleInput
          onChange={(e) => {
            setVal1(e.target.value);
          }}
          value={val1}
        />
        <TimeInputSpacer />
        <TimeSingleInput
          onChange={(e) => {
            setVal2(e.target.value);
          }}
          value={val2}
        />
        <TimeInputSpacer />
        <TimeSingleInput
          onChange={(e) => {
            setVal3(e.target.value);
          }}
          value={val3}
        />
      </div>
      <Button
        onClick={() => {
          onUpdate(val1, val2, val3);
        }}
      >
        Update
      </Button>
      <Button onClick={onCancel}>Cancel</Button>
    </>
  );
}

function TimeSingleInput({ value, onChange }) {
  return (
    <input
      type="text"
      pattern="/^\d+$/"
      value={value}
      onChange={onChange}
      style={{
        padding: ".25rem",
        fontSize: "1rem",
        flexShrink: 1,
        width: "100%",
        textAlign: "center",
      }}
    />
  );
}

function TimeInputSpacer() {
  return (
    <span
      style={{
        display: "inline-block",
        marginLeft: ".25rem",
        marginRight: ".25rem",
      }}
    >
      :
    </span>
  );
}
