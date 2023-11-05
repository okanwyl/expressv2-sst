import Navbar from "react-bootstrap/Navbar";
import "./App.css";
import Routes from "./Routes.tsx";
import Nav from "react-bootstrap/Nav";
import { LinkContainer } from "react-router-bootstrap";
import { useEffect, useRef, useState } from "react";
import { AppContext, AppContextType } from "./lib/contextLib";
import { Auth } from "aws-amplify";
import { useNavigate } from "react-router-dom";
import { onError } from "./lib/errorLib.ts";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, OrbitControls } from "@react-three/drei";

const randomFromInterval = (min, max) => {
  return Math.random() * (max - min) + min;
};

function App() {
  const nav = useNavigate();
  const devFlag = true;
  const MIN_RADIUS = 7.5;
  const MAX_RADIUS = 15;
  const DEPTH = 2;
  const LEFT_COLOR = "ff7b08";
  const RIGHT_COLOR = "1b2839";
  const NUM_POINTS = 2500;

  const getGradientStop = (ratio) => {
    ratio = ratio > 1 ? 1 : ratio < 0 ? 0 : ratio;

    const c0 = LEFT_COLOR.match(/.{1,2}/g).map(
      (oct) => parseInt(oct, 16) * (1 - ratio)
    );
    const c1 = RIGHT_COLOR.match(/.{1,2}/g).map(
      (oct) => parseInt(oct, 16) * ratio
    );
    const ci = [0, 1, 2].map((i) => Math.min(Math.round(c0[i] + c1[i]), 255));
    const color = ci
      .reduce((a, v) => (a << 8) + v, 0)
      .toString(16)
      .padStart(6, "0");

    return `#${color}`;
  };

  const calculateColor = (x) => {
    const maxDiff = MAX_RADIUS * 2;
    const distance = x + MAX_RADIUS;
    const ratio = distance / maxDiff;

    const stop = getGradientStop(ratio);

    return stop;
  };

  const triangleVertices = [
    [10, 0, 0],
    [0, 10, 0],
    [0, 0, 10],
  ];

  const pointsInner = Array.from(
    {
      length: NUM_POINTS,
    },

    (v, k) => k + 1
  ).map((num) => {
    // const randomRadius = randomFromInterval(MIN_RADIUS, MAX_RADIUS);
    // const randomAngle = Math.random() * Math.PI * 2;
    // const x = Math.cos(randomAngle) * randomRadius;
    // const y = Math.sin(randomAngle) * randomRadius;
    // const z = randomFromInterval(-DEPTH, DEPTH);
    // const color = calculateColor(x);
    // return {
    //   idx: num,
    //   position: [x, y, z],
    //   color: color,
    // };

    const r1 = Math.random();
    const r2 = Math.random();

    const x =
      (1 - Math.sqrt(r1)) * triangleVertices[0][0] +
      Math.sqrt(r1) * (1 - r2) * triangleVertices[1][0] +
      Math.sqrt(r1) * r2 * triangleVertices[2][0];

    const y =
      (1 - Math.sqrt(r1)) * triangleVertices[0][1] +
      Math.sqrt(r1) * (1 - r2) * triangleVertices[1][1] +
      Math.sqrt(r1) * r2 * triangleVertices[2][1];

    const z = 0;

    const color = calculateColor(x);
    return {
      idx: num,
      position: [x, y, z],
      color: color,
    };
  });

  const pointsOuter = Array.from(
    {
      length: NUM_POINTS / 4,
    },

    (v, k) => k + 1
  ).map((num) => {
    const randomRadius = randomFromInterval(MIN_RADIUS / 2, MAX_RADIUS * 2);
    const randomAngle = Math.random() * Math.PI * 2;

    const x = Math.cos(randomAngle) * randomRadius;
    const y = Math.sin(randomAngle) * randomRadius;
    const z = randomFromInterval(-DEPTH * 10, DEPTH * 10);
    const color = calculateColor(x);

    return {
      idx: num,
      position: [x, y, z],
      color: color,
    };
  });

  const [isAuthenticated, userHasAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  useEffect(() => {
    onLoad();
  }, []);

  async function onLoad() {
    try {
      await Auth.currentSession();
      userHasAuthenticated(true);
    } catch (e) {
      if (e !== "No current user") {
        onError(e);
      }
    }

    setIsAuthenticating(false);
  }

  async function handleLogout() {
    await Auth.signOut();
    userHasAuthenticated(false);
    nav("/login");
  }

  const Point = ({ position, color }) => {
    return (
      <Sphere position={position} args={[0.1, 10, 10]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.5}
        />
      </Sphere>
    );
  };

  const PointGroup = () => {
    const ref = useRef();

    useFrame(({ clock }) => {
      // @ts-ignore
      ref.current.rotation.z = clock.getElapsedTime() * 0.05;
    });
    return (
      <group ref={ref}>
        {/* <Point position={[0, 0, 0]} color="red" />
        <Point position={[1, 1, 1]} color="red" />
        <Point position={[2, 2, 2]} color="red" /> */}
        {pointsInner.map((point) => (
          <Point
            key={point.idx}
            position={point.position}
            color={point.color}
          />
        ))}

        {pointsOuter.map((point) => (
          <Point
            key={point.idx}
            position={point.position}
            color={point.color}
          />
        ))}
      </group>
    );
  };

  if (devFlag) {
    return (
      <div className="relative">
        <Canvas
          camera={{ position: [0, 0, -25] }}
          style={{ height: "100vh", width: "100vw" }}
        >
          {/* <OrbitControls maxDistance={20} minDistance={10} /> */}
          <OrbitControls />
          <directionalLight />
          <pointLight position={[-30, 0, -30]} power={10.0} />
          <PointGroup />
        </Canvas>
      </div>
    );
  }

  return (
    !isAuthenticating && (
      <div className="App container py-3">
        <Navbar collapseOnSelect bg="light" expand="md" className="mb-3 px-3">
          <LinkContainer to="/">
            <Navbar.Brand className="fw-bold text-muted">Scratch</Navbar.Brand>
          </LinkContainer>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Nav activeKey={window.location.pathname}>
              {isAuthenticated ? (
                <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
              ) : (
                <>
                  <LinkContainer to="/signup">
                    <Nav.Link>Signup</Nav.Link>
                  </LinkContainer>
                  <LinkContainer to="/login">
                    <Nav.Link>Login</Nav.Link>
                  </LinkContainer>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <AppContext.Provider
          value={{ isAuthenticated, userHasAuthenticated } as AppContextType}
        >
          <Routes />
        </AppContext.Provider>
      </div>
    )
  );
}

export default App;
