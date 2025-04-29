import { useState, useEffect, useRef, useCallback } from "react";
import { Container, Row, Col, Button, Modal, Form, InputGroup } from "react-bootstrap";
import { FaCircle } from "react-icons/fa6";
import { RxLapTimer } from "react-icons/rx";
import { FaPlay } from "react-icons/fa";
import confetti from "canvas-confetti";

const ClearThePoints = () => {
  const gameAreaRef = useRef(null);
  const [circles, setCircles] = useState([]);
  const [time, setTime] = useState(0);
  const [totalPoints, setTotalPoints] = useState(10);
  const [customPoints, setCustomPoints] = useState("10");
  const [points, setPoints] = useState(0);
  const [nextPointToClick, setNextPointToClick] = useState(1);

  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameReady, setGameReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [autoplayEnabled, setAutoplayEnabled] = useState(false);
  const autoplayTimerRef = useRef(null);

  const circlesRef = useRef(circles);
  const nextPointToClickRef = useRef(nextPointToClick);
  const gameCompletedRef = useRef(gameCompleted);

  useEffect(() => {
    circlesRef.current = circles;
  }, [circles]);

  useEffect(() => {
    nextPointToClickRef.current = nextPointToClick;
  }, [nextPointToClick]);

  useEffect(() => {
    gameCompletedRef.current = gameCompleted;
  }, [gameCompleted]);

  // Hàm tạo vị trí ngẫu nhiên cho các vòng tròn
  const generateRandomPositions = (numPoints = totalPoints) => {
    if (!gameAreaRef.current) return [];

    const circleCount = numPoints;
    const circleSize = 40;
    const padding = 20;

    const gameWidth = gameAreaRef.current.clientWidth;
    const gameHeight = gameAreaRef.current.clientHeight;

    const maxX = gameWidth - circleSize - padding;
    const maxY = gameHeight - circleSize - padding;
    const minX = padding;
    const minY = padding;

    const positions = [];

    for (let i = 1; i <= circleCount; i++) {
      let newPosition;
      let overlapping;
      let attempts = 0;
      const maxAttempts = 100;

      do {
        overlapping = false;
        attempts++;

        // Tạo vị trí ngẫu nhiên
        const left = Math.floor(Math.random() * (maxX - minX)) + minX;
        const top = Math.floor(Math.random() * (maxY - minY)) + minY;

        newPosition = { id: i, left, top };

        for (const pos of positions) {
          const dx = pos.left - left;
          const dy = pos.top - top;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < circleSize + padding) {
            overlapping = true;
            break;
          }
        }
      } while (overlapping && attempts < maxAttempts);

      positions.push({
        id: i,
        visible: true,
        fading: false,
        left: newPosition.left,
        top: newPosition.top,
      });
    }

    return positions;
  };

  useEffect(() => {
    if (!isInitialized) {
      const initializeCircles = () => {
        if (gameAreaRef.current) {
          const newPositions = generateRandomPositions(totalPoints);
          setCircles(newPositions);
          setIsInitialized(true);
        }
      };

      const initTimer = setTimeout(initializeCircles, 100);

      return () => clearTimeout(initTimer);
    }
  }, [isInitialized, totalPoints]);

  const debounceRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (gameStarted || !gameReady) return;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        if (gameAreaRef.current) {
          const newPositions = generateRandomPositions(totalPoints);
          setCircles(newPositions);
        }
      }, 200);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [gameStarted, gameReady, totalPoints]);

  // Đồng hồ đếm thời gian
  useEffect(() => {
    if (!gameStarted) return;

    const timer = setInterval(() => {
      setTime((prev) => prev + 0.1);
    }, 100);

    return () => clearInterval(timer);
  }, [gameStarted]);

  const handleCircleClick = useCallback(
    (id, e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (gameCompletedRef.current) return;

      if (id !== nextPointToClickRef.current) {
        setGameStarted(false);
        setAutoplayEnabled(false);
        clearInterval(autoplayTimerRef.current);
        setShowGameOverModal(true);
        return;
      }

      setCircles((prevCircles) =>
        prevCircles.map((circle) =>
          circle.id === id ? { ...circle, fading: true } : circle
        )
      );

      setTimeout(() => {
        setCircles((prevCircles) =>
          prevCircles.map((circle) =>
            circle.id === id
              ? { ...circle, visible: false, fading: false }
              : circle
          )
        );
      }, 1000);

      setPoints((prevPoints) => prevPoints - 1);

      // Kiểm tra điểm cuối cùng
      if (id === totalPoints) {
        setGameCompleted(true);

        setTimeout(() => {
          setShowResultModal(true);
          setGameStarted(false);

          // Tạo hiệu ứng pháo hoa
          showFireworks();
        }, 1000);

        if (autoplayTimerRef.current) {
          clearInterval(autoplayTimerRef.current);
          autoplayTimerRef.current = null;
        }
      } else {
        setNextPointToClick((prev) => prev + 1);
      }
    },
    [totalPoints]
  );

  // Hiệu ứng pháo hoa
  const showFireworks = () => {
    const canvas = document.getElementById("fireworks-canvas");
    if (!canvas) return;

    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });

    const duration = 3 * 1000; // Thời gian pháo hoa kéo dài 3 giây
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      myConfetti({
        ...defaults,
        particleCount: 50,
        origin: {
          x: randomInRange(0.1, 0.9),
          y: randomInRange(0.1, 0.5),
        },
        colors: ["#bb0000", "#ffffff", "#00bbff", "#ffbb00", "#00ffbb"],
      });
    }, 250);
  };

  const handlePlay = () => {
    setShowPointsModal(true);
  };

  const handleStartGame = () => {
    const numPoints = parseInt(customPoints);
    const validPoints = isNaN(numPoints)
      ? 10
      : Math.min(Math.max(numPoints, 1));

    setTotalPoints(validPoints);
    setPoints(validPoints);
    setCustomPoints(validPoints.toString());

    const newPositions = generateRandomPositions(validPoints);
    setCircles(newPositions);

    setGameReady(true);
    setNextPointToClick(1);
    setGameStarted(true);
    setGameCompleted(false);
    setShowPointsModal(false);

    if (autoplayEnabled) {
      startAutoplay();
    }
  };

  const handlePointsChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    const numberValue = parseInt(value, 10);

    if (numberValue > 0) {
      setCustomPoints(numberValue.toString());
    } else {
      setCustomPoints("");
    }
  };

  const handleRestart = () => {
    const newPositions = generateRandomPositions(totalPoints);

    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
    setTime(0);
    setCircles(newPositions);
    setPoints(totalPoints);
    setGameStarted(false);
    setGameReady(false);
    setNextPointToClick(1);
    setGameCompleted(false);
    setShowRestartModal(false);
    setShowResultModal(false);
    setAutoplayEnabled(false);
    setShowGameOverModal(false);
  };

  const startAutoplay = useCallback(() => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
    }

    autoplayTimerRef.current = setInterval(() => {
      const nextPoint = nextPointToClickRef.current;
      const currentCircles = circlesRef.current;
      const isGameCompleted = gameCompletedRef.current;

      if (isGameCompleted) {
        clearInterval(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
        return;
      }

      const nextCircle = currentCircles.find(
        (circle) => circle.id === nextPoint && circle.visible
      );

      if (nextCircle) {
        handleCircleClick(nextPoint);
      } else {
        clearInterval(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
        setAutoplayEnabled(false);
      }
    }, 300);
  }, [handleCircleClick]);

  const toggleAutoplay = () => {
    if (!gameStarted) {
      setAutoplayEnabled(!autoplayEnabled);
      return;
    }

    if (!autoplayEnabled) {
      setAutoplayEnabled(true);
      startAutoplay();
    } else {
      setAutoplayEnabled(false);
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
    }
  };

  useEffect(() => {
    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (gameStarted && autoplayEnabled && !autoplayTimerRef.current) {
      startAutoplay();
    }
  }, [gameStarted, autoplayEnabled, startAutoplay]);

  return (
    <Container className="game-container" fluid>
      <h1 className="text-center my-4">Clear The Points</h1>

      <Row className="mb-3">
        <Col xs={6} className="text-left">
          <p className="timer">
            <RxLapTimer />
            &nbsp;: {time.toFixed(1)}s
          </p>
        </Col>
        <Col xs={6} className="text-right">
          <p className="points">
            <FaCircle />
            &nbsp;: {points} Points
          </p>
        </Col>
      </Row>

      <Row className="mb-3 justify-content-center">
        {!gameReady ? (
          <Button
            variant="success"
            onClick={handlePlay}
            className="play-button"
            size="lg"
          >
            <FaPlay /> Play
          </Button>
        ) : (
          <div className="text-center">
            {!gameCompleted && (
              <span className="next-point-indicator">
                Next point: {nextPointToClick}
              </span>
            )}
            <Button
              variant="primary"
              onClick={() => setShowRestartModal(true)}
              className="restart-button mx-2"
            >
              Restart
            </Button>

            <Button
              variant={autoplayEnabled ? "danger" : "secondary"}
              onClick={toggleAutoplay}
              className="autoplay-button mx-2"
              disabled={gameCompleted}
            >
              {autoplayEnabled ? "AutoPlay: ON" : "AutoPlay: OFF"}
            </Button>
          </div>
        )}
      </Row>

      <div className="game-area" ref={gameAreaRef}>
        {gameReady &&
          circles.map(
            (circle) =>
              circle.visible && (
                <div
                  key={circle.id}
                  onClick={(e) => handleCircleClick(circle.id, e)}
                  className={`circle ${
                    circle.id === nextPointToClick ? "next-to-click" : ""
                  } ${circle.fading ? "fading" : ""}`}
                  style={{
                    left: `${circle.left}px`,
                    top: `${circle.top}px`,
                  }}
                >
                  {circle.id}
                </div>
              )
          )}
      </div>

      {/* Modal xác nhận khởi động lại */}
      <Modal
        show={showRestartModal}
        onHide={() => setShowRestartModal(false)}
        centered
      >
        <Modal.Body className="result-modal-body">
          <h2 className="restart-title">Do You Want To Restart Game?</h2>

          <Button
            variant="secondary"
            className="cancel-button"
            onClick={() => setShowRestartModal(false)}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            className="result-button"
            onClick={handleRestart}
          >
            Confirm
          </Button>
        </Modal.Body>
      </Modal>

      {/* Modal hiển thị kết quả */}
      <Modal
        show={showResultModal}
        onHide={() => setShowResultModal(false)}
        centered
      >
        <Modal.Body className="result-modal-body">
          <h2 className="result-title">ALL CLEARED!!!</h2>
          <p className="result-time">
            <RxLapTimer className="time-result" />: {time.toFixed(1)} Seconds
          </p>
          <Button
            variant="primary"
            className="result-button"
            onClick={handleRestart}
          >
            Play Again
          </Button>
        </Modal.Body>
      </Modal>

      {/* Modal Game Over */}
      <Modal
        show={showGameOverModal}
        onHide={() => setShowGameOverModal(false)}
        centered
      >
        <Modal.Body className="result-modal-body">
          <h2 className="result-title" style={{ color: "#dc3545" }}>
            GAME OVER!
          </h2>
          <p className="result-message">You clicked the wrong number!</p>
          <Button
            variant="danger"
            className="result-button"
            onClick={handleRestart}
          >
            Try Again
          </Button>
        </Modal.Body>
      </Modal>

      {/* Modal nhập số điểm */}
      <Modal
        show={showPointsModal}
        onHide={() => setShowPointsModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header>
          <Modal.Title>Set Number of Points</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>How many points do you want to play with?</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  value={customPoints}
                  onChange={handlePointsChange}
                  placeholder="Enter number of points"
                  aria-label="Number of points"
                  aria-describedby="points-addon"
                />
                <InputGroup.Text id="points-addon">
                  <FaCircle className="fa-1" />
                </InputGroup.Text>
              </InputGroup>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPointsModal(false)}>
            Cancel
          </Button>
          <Button
            className="start-game"
            variant="success"
            onClick={handleStartGame}
          >
            Start Game
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Canvas cho hiệu ứng pháo hoa */}
      <canvas id="fireworks-canvas" />
    </Container>
  );
};

export default ClearThePoints;
