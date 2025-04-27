import { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Button, Modal } from "react-bootstrap";
import { FaCircle } from "react-icons/fa6";
import { RxLapTimer } from "react-icons/rx";
import confetti from "canvas-confetti";

const ClearThePoints = () => {
  const gameAreaRef = useRef(null);
  const [circles, setCircles] = useState([]);
  const [time, setTime] = useState(0);
  const [points, setPoints] = useState(10);
  const [gameStarted, setGameStarted] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Hàm tạo vị trí ngẫu nhiên cho các vòng tròn
  const generateRandomPositions = () => {
    if (!gameAreaRef.current) return [];

    const circleCount = 10;
    const circleSize = 40;
    const padding = 30;

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
          const newPositions = generateRandomPositions();
          setCircles(newPositions);
          setIsInitialized(true);
        }
      };

      const initTimer = setTimeout(initializeCircles, 100);

      return () => clearTimeout(initTimer);
    }
  }, [isInitialized, gameAreaRef.current]);

  useEffect(() => {
    const handleResize = () => {
      if (gameStarted) return;

      const timer = setTimeout(() => {
        if (gameAreaRef.current) {
          const newPositions = generateRandomPositions();
          setCircles(newPositions);
        }
      }, 200);

      return () => clearTimeout(timer);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [gameStarted]);

  // Đồng hồ đếm thời gian
  useEffect(() => {
    if (!gameStarted) return;

    const timer = setInterval(() => {
      setTime((prev) => prev + 0.1);
    }, 100);

    return () => clearInterval(timer);
  }, [gameStarted]);

  // Xử lý khi click vào vòng tròn
  const handleCircleClick = (id, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!gameStarted) {
      setGameStarted(true);
    }

    setCircles((prevCircles) =>
      prevCircles.map((circle) =>
        circle.id === id ? { ...circle, visible: false } : circle
      )
    );

    setPoints((prevPoints) => prevPoints - 1);
  };

  const handleRestart = () => {
    const newPositions = generateRandomPositions();
    setCircles(newPositions);
    setTime(0);
    setPoints(10);
    setGameStarted(false);
    setShowRestartModal(false);
    setShowResultModal(false);
  };

  // Hiệu ứng khi hoàn thành trò chơi
  useEffect(() => {
    if (
      circles.length > 0 &&
      circles.every((circle) => !circle.visible) &&
      gameStarted
    ) {
      setShowResultModal(true);
      setGameStarted(false);

      // Tạo hiệu ứng pháo hoa
      const canvas = document.getElementById("fireworks-canvas");
      if (!canvas) return;

      const myConfetti = confetti.create(canvas, {
        resize: true,
        useWorker: true,
      });

      const duration = 5 * 1000;
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
    }
  }, [circles, gameStarted]);

  return (
    <Container className="game-container">
      <h1 className="text-center my-4">Clear The Points</h1>

      <Row className="mb-3">
        <Col xs={6} className="text-right">
          <p className="timer">
            <RxLapTimer />
            &nbsp;: {time.toFixed(1)}s
          </p>
        </Col>
        <Col xs={6} className="text-left">
          <p className="points">
            <FaCircle />
            &nbsp;: {points} Points
          </p>
        </Col>
      </Row>

      <Button
        variant="primary"
        onClick={() => setShowRestartModal(true)}
        className="restart-button mb-4 d-block mx-auto"
      >
        Restart
      </Button>

      <div className="game-area" ref={gameAreaRef}>
        {circles.map(
          (circle) =>
            circle.visible && (
              <div
                key={circle.id}
                onClick={(e) => handleCircleClick(circle.id, e)}
                className="circle"
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
            className=""
            onClick={() => setShowRestartModal(false)}
          >
            No
          </Button>

          <Button
            variant="primary"
            className="result-button"
            onClick={handleRestart}
          >
            Yes
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

      {/* Canvas cho hiệu ứng pháo hoa */}
      <canvas id="fireworks-canvas" />
    </Container>
  );
};

export default ClearThePoints;
