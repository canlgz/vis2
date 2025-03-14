import React, { useState, useEffect, useRef } from "react";
import "./styles.css";

const App = () => {
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const [agents, setAgents] = useState([]);
  const [collectiveState, setCollectiveState] = useState("疊加態");
  const [params, setParams] = useState({
    entanglementStrength: 0.5,
    viralitySpeed: 0.6,
    influencerImpact: 0.7,
  });

  // 觀點追蹤狀態
  const [opinionStats, setOpinionStats] = useState({
    positive: 0,
    negative: 0,
    neutral: 0,
    lastChange: {
      positive: 0,
      negative: 0,
    },
    showChangeAnimation: false,
  });

  // 集氣歷史記錄和突發事件
  const [gatheringHistory, setGatheringHistory] = useState([]);
  const [disruptionActive, setDisruptionActive] = useState(false);
  const [disruptionType, setDisruptionType] = useState(null);
  const [disruptionTime, setDisruptionTime] = useState(0);

  // 初始化
  useEffect(() => {
    initializeAgents();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // 初始化代理人
  const initializeAgents = () => {
    const newAgents = [];
    for (let i = 0; i < 25; i++) {
      // 均勻分布的觀點
      let opinion;
      if (i < 8) {
        opinion = -0.8 + Math.random() * 0.3; // 負面觀點
      } else if (i < 17) {
        opinion = -0.3 + Math.random() * 0.6; // 中立觀點
      } else {
        opinion = 0.5 + Math.random() * 0.5; // 正面觀點
      }

      // 是否為意見領袖
      const isInfluencer = i % 5 === 0;

      newAgents.push({
        id: i,
        x: 100 + Math.random() * 600,
        y: 100 + Math.random() * 400,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        radius: isInfluencer ? 12 : 8,
        opinion: opinion,
        certainty: 0.3 + Math.random() * 0.3,
        influence: isInfluencer ? 0.8 : 0.2,
        color: opinion > 0 ? "#ff6b6b" : opinion < -0.3 ? "#4dabf7" : "#a3a3a3",
        disrupted: false, // 新增：是否受到突發事件影響
      });
    }

    setAgents(newAgents);

    // 初始化觀點統計
    updateOpinionStats(newAgents);
  };

  // 更新觀點統計
  const updateOpinionStats = (
    agentList,
    showAnimation = false,
    direction = null
  ) => {
    const positiveCount = agentList.filter((a) => a.opinion > 0.3).length;
    const negativeCount = agentList.filter((a) => a.opinion < -0.3).length;
    const neutralCount = agentList.length - positiveCount - negativeCount;
    const totalAgents = agentList.length;

    // 計算變化量
    const positivePercentage = Math.round((positiveCount / totalAgents) * 100);
    const negativePercentage = Math.round((negativeCount / totalAgents) * 100);

    let positiveChange = 0;
    let negativeChange = 0;

    if (direction === 1) {
      positiveChange = positivePercentage - opinionStats.positive;
    } else if (direction === -1) {
      negativeChange = negativePercentage - opinionStats.negative;
    }

    setOpinionStats({
      positive: positivePercentage,
      negative: negativePercentage,
      neutral: 100 - positivePercentage - negativePercentage,
      lastChange: {
        positive: positiveChange,
        negative: negativeChange,
      },
      showChangeAnimation: showAnimation,
    });

    // 5秒後關閉動畫效果
    if (showAnimation) {
      setTimeout(() => {
        setOpinionStats((prev) => ({ ...prev, showChangeAnimation: false }));
      }, 5000);
    }
  };

  // 強力反轉效果管理
  useEffect(() => {
    if (!disruptionActive) return;

    // 設定強力反轉持續時間
    const disruptionDuration = 5000; // 5秒

    // 更新經過時間
    const interval = setInterval(() => {
      setDisruptionTime((prev) => {
        const newTime = prev + 100;
        // 如果時間到，清除突發事件狀態
        if (newTime >= disruptionDuration) {
          clearInterval(interval);
          setDisruptionActive(false);
          setDisruptionType(null);
          setDisruptionTime(0);

          // 重置代理人的disrupted狀態
          setAgents((prev) =>
            prev.map((agent) => ({
              ...agent,
              disrupted: false,
            }))
          );

          return 0;
        }
        return newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [disruptionActive]);

  // 圖像渲染循環
  useEffect(() => {
    if (!canvasRef.current || agents.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let lastUpdateTime = 0;
    const updateInterval = 100;

    const render = (timestamp) => {
      if (timestamp - lastUpdateTime > updateInterval) {
        updateAgents();
        lastUpdateTime = timestamp;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawAgents(ctx);

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [
    agents,
    params,
    opinionStats,
    disruptionActive,
    disruptionTime,
    disruptionType,
  ]);

  // 更新代理人
  const updateAgents = () => {
    const updatedAgents = [...agents];

    // 計算各種意見比例
    const positiveCount = updatedAgents.filter((a) => a.opinion > 0.3).length;
    const negativeCount = updatedAgents.filter((a) => a.opinion < -0.3).length;
    const totalAgents = updatedAgents.length;
    const positiveRatio = positiveCount / totalAgents;
    const negativeRatio = negativeCount / totalAgents;

    // 更新觀點統計（不顯示動畫）
    updateOpinionStats(updatedAgents);

    // 判斷當前集體狀態
    if (positiveRatio > 0.65) {
      setCollectiveState("正向坍縮態");
    } else if (negativeRatio > 0.65) {
      setCollectiveState("負向坍縮態");
    } else if (positiveRatio > 0.45 || negativeRatio > 0.45) {
      setCollectiveState("部分坍縮態");
    } else {
      setCollectiveState("量子疊加態");
    }

    // 更新位置與互動
    updatedAgents.forEach((agent) => {
      // 更新位置 - 突發事件期間加速移動
      const speedFactor = disruptionActive ? 0.8 : 0.3;
      agent.x += agent.vx * speedFactor;
      agent.y += agent.vy * speedFactor;

      // 邊界檢查
      if (agent.x < agent.radius || agent.x > 800 - agent.radius)
        agent.vx *= -1;
      if (agent.y < agent.radius || agent.y > 600 - agent.radius)
        agent.vy *= -1;

      // 互動與影響 - 減慢互動速度
      updatedAgents.forEach((other) => {
        if (other.id === agent.id) return;

        const dx = other.x - agent.x;
        const dy = other.y - agent.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 物理互動與意見交換
        if (dist < 100) {
          // 意見相似性
          const opinionDiff = Math.abs(agent.opinion - other.opinion);
          const similarity = 1 - opinionDiff;

          // 糾纏吸引力 - 突發事件中減弱吸引
          const attractionFactor = disruptionActive ? 0.15 : 0.25;
          const attraction =
            ((similarity * params.entanglementStrength) / (dist * dist)) *
            attractionFactor;
          agent.vx += (attraction * dx) / dist;
          agent.vy += (attraction * dy) / dist;

          // 意見交換 - 突發事件中加速交換
          if (dist < 50) {
            // 意見領袖效應
            const otherInfluence =
              other.influence * (1 + params.influencerImpact);
            let influenceFactor = 0.002 * otherInfluence;

            // 突發事件期間，增加意見交換速率
            if (disruptionActive) {
              influenceFactor *= 2;
            }

            // 互相影響
            agent.opinion += (other.opinion - agent.opinion) * influenceFactor;
            agent.opinion = Math.max(-1, Math.min(1, agent.opinion));

            // 更新顏色
            agent.color =
              agent.opinion > 0.3
                ? "#ff6b6b"
                : agent.opinion < -0.3
                ? "#4dabf7"
                : "#a3a3a3";
          }
        }
      });

      // 病毒式傳播
      const viralProb = params.viralitySpeed * 0.005;
      if (
        Math.random() < (disruptionActive ? viralProb * 3 : viralProb) &&
        agent.influence > 0.7
      ) {
        // 意見領袖隨機影響遠處的代理人 - 突發事件期間加強傳播
        const randomIndex = Math.floor(Math.random() * updatedAgents.length);
        if (randomIndex !== agent.id) {
          const target = updatedAgents[randomIndex];
          const viralFactor = disruptionActive
            ? 0.1 * params.viralitySpeed
            : 0.03 * params.viralitySpeed;
          target.opinion += (agent.opinion - target.opinion) * viralFactor;
          target.opinion = Math.max(-1, Math.min(1, target.opinion));
          target.color =
            target.opinion > 0.3
              ? "#ff6b6b"
              : target.opinion < -0.3
              ? "#4dabf7"
              : "#a3a3a3";
        }
      }
    });

    setAgents(updatedAgents);
  };

  // 繪製代理人
  const drawAgents = (ctx) => {
    const isCollapsed = collectiveState.includes("坍縮");
    const isPartialCollapse = collectiveState === "部分坍縮態";

    // 繪製背景效果 - 顯示集體狀態
    if (disruptionActive) {
      // 突發事件背景效果
      const progress = disruptionTime / 5000; // 0-1之間
      const intensity = Math.sin(Date.now() * 0.003) * 0.2 + 0.8; // 閃爍效果

      // 根據突發事件類型設定顏色
      let eventColor;
      if (disruptionType === "positive") {
        eventColor = `rgba(255, 107, 107, ${0.2 * intensity})`;
      } else {
        eventColor = `rgba(77, 171, 247, ${0.2 * intensity})`;
      }

      // 放射性背景
      const gradient = ctx.createRadialGradient(400, 300, 50, 400, 300, 400);
      gradient.addColorStop(0, eventColor);
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 600);

      // 震盪波紋
      const waveCount = 5;
      for (let i = 0; i < waveCount; i++) {
        const radius = progress * 500 + ((i * 100) % 500);
        const waveAlpha = 0.3 * (1 - radius / 500) * intensity;

        ctx.strokeStyle =
          disruptionType === "positive"
            ? `rgba(255, 107, 107, ${waveAlpha})`
            : `rgba(77, 171, 247, ${waveAlpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(400, 300, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 閃電效果
      if (Math.random() < 0.3) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        ctx.lineWidth = 2;
        drawLightning(ctx, 400, 50, 400, 550, 5, 50);
      }
    } else if (isCollapsed) {
      if (isPartialCollapse) {
        // 部分坍縮態特殊背景
        const gradient = ctx.createRadialGradient(400, 300, 50, 400, 300, 400);
        gradient.addColorStop(0, "rgba(255, 107, 107, 0.03)");
        gradient.addColorStop(0.33, "rgba(77, 171, 247, 0.03)");
        gradient.addColorStop(0.66, "rgba(255, 107, 107, 0.03)");
        gradient.addColorStop(1, "rgba(77, 171, 247, 0.01)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);

        // 添加量子干涉線條效果
        ctx.strokeStyle = "rgba(180, 180, 255, 0.05)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) {
          const yPos = i * 30;
          ctx.beginPath();
          for (let x = 0; x < 800; x += 5) {
            const y = yPos + Math.sin(x * 0.05 + Date.now() * 0.001) * 5;
            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }
      } else {
        // 一般坍縮態背景
        const gradient = ctx.createRadialGradient(400, 300, 50, 400, 300, 400);
        if (collectiveState.includes("正向")) {
          gradient.addColorStop(0, "rgba(255, 107, 107, 0.05)");
          gradient.addColorStop(1, "rgba(255, 107, 107, 0)");
        } else {
          gradient.addColorStop(0, "rgba(77, 171, 247, 0.05)");
          gradient.addColorStop(1, "rgba(77, 171, 247, 0)");
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);
      }
    }

    // 繪製集氣歷史路徑
    if (gatheringHistory.length > 0) {
      ctx.save();
      ctx.globalAlpha = 0.2;

      gatheringHistory.forEach((event) => {
        // 根據集氣方向設定顏色
        const color = event.direction > 0 ? "#ff6b6b" : "#4dabf7";
        const age = Math.min(1, (Date.now() - event.timestamp) / 10000); // 10秒漸淡
        const isDisruption = event.isDisruption;

        // 繪製集氣波紋
        ctx.strokeStyle = color;
        ctx.lineWidth = isDisruption ? 4 * (1 - age) : 2 * (1 - age);
        ctx.beginPath();
        ctx.arc(400, 300, 250 * age + 50, 0, Math.PI * 2);
        ctx.stroke();

        // 強力反轉的特殊效果
        if (isDisruption) {
          ctx.fillStyle = `${color}33`;
          ctx.beginPath();
          ctx.arc(400, 300, 240 * age + 50, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.restore();

      // 清理過期的歷史記錄
      const now = Date.now();
      if (
        gatheringHistory.length > 0 &&
        now - gatheringHistory[0].timestamp > 10000
      ) {
        setGatheringHistory(
          gatheringHistory.filter((event) => now - event.timestamp <= 10000)
        );
      }
    }

    // 先畫連線
    agents.forEach((agent) => {
      agents.forEach((other) => {
        if (other.id <= agent.id) return;

        const dx = other.x - agent.x;
        const dy = other.y - agent.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 畫出糾纏連線
        if (
          dist < 100 &&
          Math.sign(agent.opinion) === Math.sign(other.opinion)
        ) {
          const similarity = 1 - Math.abs(agent.opinion - other.opinion);
          let alpha = similarity * 0.5;

          if (isPartialCollapse) {
            alpha *= 1.5;
          }

          // 突發事件中，連線閃爍變化
          if (disruptionActive && (agent.disrupted || other.disrupted)) {
            alpha *= Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
          }

          if (alpha > 0.1) {
            let strokeColor;
            if (agent.opinion > 0.3) {
              strokeColor = `rgba(255, 107, 107, ${alpha})`;
            } else if (agent.opinion < -0.3) {
              strokeColor = `rgba(77, 171, 247, ${alpha})`;
            } else {
              strokeColor = `rgba(163, 163, 163, ${alpha})`;
            }

            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = alpha * (isPartialCollapse ? 3 : 2);

            // 添加波浪線效果，表示量子糾纏
            const amplitude = isPartialCollapse ? 5 : 3;

            ctx.beginPath();

            // 畫波浪線
            const length = Math.sqrt(dx * dx + dy * dy);
            const steps = Math.max(5, Math.floor(length / 5));

            for (let i = 0; i <= steps; i++) {
              const t = i / steps;
              const xx = agent.x + dx * t;
              const yy = agent.y + dy * t;

              // 添加正弦波形
              const angle = Math.atan2(dy, dx) + Math.PI / 2;
              const waveSin =
                Math.sin(t * Math.PI * 2 * 2) * amplitude * similarity;

              const newX = xx + Math.cos(angle) * waveSin;
              const newY = yy + Math.sin(angle) * waveSin;

              if (i === 0) {
                ctx.moveTo(newX, newY);
              } else {
                ctx.lineTo(newX, newY);
              }
            }

            ctx.stroke();
          }
        }
      });
    });

    // 再畫代理人
    agents.forEach((agent) => {
      // 量子波效果 - 更平滑的波動
      const wavesCount =
        disruptionActive && agent.disrupted ? 9 : isPartialCollapse ? 7 : 5;

      // 添加脈衝效果
      const pulseRate = 0.001;
      const pulseFactor = (Math.sin(Date.now() * pulseRate) + 1) / 2; // 0-1之間脈衝

      for (let i = 0; i < wavesCount; i++) {
        // 波動半徑隨時間變化
        const waveRadius =
          agent.radius * (1.5 + i * 0.5) * (0.8 + pulseFactor * 0.4);
        let alpha = 0.15 * (1 - i / wavesCount) * (0.7 + pulseFactor * 0.3);

        if (isPartialCollapse) {
          alpha *= 1.3;
        }

        // 突發事件影響的代理人有特殊波動效果
        if (disruptionActive && agent.disrupted) {
          alpha *= 1.6;
        }

        let waveColor;
        if (agent.opinion > 0.3) {
          waveColor = `rgba(255, 107, 107, ${alpha})`;
        } else if (agent.opinion < -0.3) {
          waveColor = `rgba(77, 171, 247, ${alpha})`;
        } else {
          waveColor = `rgba(163, 163, 163, ${alpha})`;
        }

        ctx.fillStyle = waveColor;
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, waveRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 代理人主體
      ctx.fillStyle = agent.color;
      ctx.beginPath();
      ctx.arc(agent.x, agent.y, agent.radius, 0, Math.PI * 2);
      ctx.fill();

      // 確定性環
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;

      // 突發事件期間，受影響的代理人確定性降低
      const displayCertainty =
        disruptionActive && agent.disrupted
          ? agent.certainty * (0.5 + Math.sin(Date.now() * 0.01) * 0.3)
          : agent.certainty;

      ctx.beginPath();
      ctx.arc(
        agent.x,
        agent.y,
        agent.radius,
        0,
        Math.PI * 2 * displayCertainty
      );
      ctx.stroke();

      // 標記意見領袖
      if (agent.influence > 0.7) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("★", agent.x, agent.y);

        // 為意見領袖添加光暈
        let haloColor;
        if (agent.opinion > 0.3) {
          haloColor = `rgba(255, 107, 107, ${isPartialCollapse ? 0.7 : 0.5})`;
        } else if (agent.opinion < -0.3) {
          haloColor = `rgba(77, 171, 247, ${isPartialCollapse ? 0.7 : 0.5})`;
        } else {
          haloColor = `rgba(163, 163, 163, ${isPartialCollapse ? 0.7 : 0.5})`;
        }

        // 突發事件中，意見領袖光環更明顯
        if (disruptionActive && agent.disrupted) {
          ctx.strokeStyle = haloColor;
          ctx.lineWidth = 3;

          const pulseSize = 1 + Math.sin(Date.now() * 0.005) * 0.5;
          ctx.beginPath();
          ctx.arc(
            agent.x,
            agent.y,
            agent.radius * 2 * pulseSize,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        } else {
          ctx.strokeStyle = haloColor;
          ctx.lineWidth = isPartialCollapse ? 2 : 1;
          ctx.beginPath();
          ctx.arc(
            agent.x,
            agent.y,
            agent.radius * (isPartialCollapse ? 1.8 : 1.5),
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }
      }

      // 突發事件受影響代理人的特殊標記
      if (disruptionActive && agent.disrupted) {
        ctx.strokeStyle = disruptionType === "positive" ? "#ff6b6b" : "#4dabf7";
        ctx.lineWidth = 2;

        // 閃爍效果
        const blinkAlpha = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
        ctx.strokeStyle =
          disruptionType === "positive"
            ? `rgba(255, 107, 107, ${blinkAlpha})`
            : `rgba(77, 171, 247, ${blinkAlpha})`;

        // 震盪環
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, agent.radius * 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // 繪製文字說明
    ctx.fillStyle = "#333";
    ctx.font = "14px Arial";
    ctx.textAlign = "left";

    // 根據狀態調整顯示樣式
    if (disruptionActive) {
      // 突發事件時的特殊顯示
      const eventType =
        disruptionType === "positive" ? "正向突發事件" : "負向突發事件";
      const progress = Math.round((disruptionTime / 5000) * 100);

      ctx.fillStyle = "#333";
      ctx.font = "bold 16px Arial";
      ctx.fillText(`目前狀態: `, 10, 20);

      // 閃爍效果
      const blinkAlpha = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
      ctx.fillStyle =
        disruptionType === "positive"
          ? `rgba(255, 107, 107, ${blinkAlpha})`
          : `rgba(77, 171, 247, ${blinkAlpha})`;

      ctx.fillText(`${eventType} 進行中 (${progress}%)`, 120, 20);

      // 添加閃爍邊框
      ctx.strokeStyle =
        disruptionType === "positive"
          ? `rgba(255, 107, 107, ${blinkAlpha})`
          : `rgba(77, 171, 247, ${blinkAlpha})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(5, 5, 360, 25);

      // 還原標準文字樣式
      ctx.fillStyle = "#333";
      ctx.font = "14px Arial";
    } else if (isPartialCollapse) {
      // 部分坍縮態特殊顯示
      ctx.fillStyle = "#333";
      ctx.font = "bold 16px Arial";
      ctx.fillText(`目前狀態: `, 10, 20);

      const gradient = ctx.createLinearGradient(120, 0, 280, 0);
      gradient.addColorStop(0, "#ff6b6b");
      gradient.addColorStop(1, "#4dabf7");
      ctx.fillStyle = gradient;
      ctx.fillText(`${collectiveState}`, 120, 20);

      const pulseOpacity = ((Math.sin(Date.now() * 0.005) + 1) / 2) * 0.7 + 0.3;
      ctx.strokeStyle = `rgba(100, 100, 255, ${pulseOpacity})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(5, 5, 290, 25);

      ctx.fillStyle = "#333";
      ctx.font = "14px Arial";
    } else {
      ctx.fillText(`目前狀態: ${collectiveState}`, 10, 20);
    }
  };

  // 繪製閃電效果
  const drawLightning = (ctx, x1, y1, x2, y2, segments, boltWidth) => {
    const segmentHeight = (y2 - y1) / segments;
    const rough = boltWidth / 2;

    ctx.beginPath();
    ctx.moveTo(x1, y1);

    for (let i = 0; i < segments; i++) {
      const xDisplace = (Math.random() - 0.5) * rough * 2;
      const newX = x1 + xDisplace;
      const newY = y1 + segmentHeight * (i + 1);
      ctx.lineTo(newX, newY);
    }

    ctx.stroke();
  };

  // 處理參數變化
  const handleParamChange = (name, value) => {
    setParams({ ...params, [name]: value });
  };

  // 發起集氣
  const triggerCollectiveGathering = (direction) => {
    // 記錄集氣前的數值
    const beforePositive = opinionStats.positive;
    const beforeNegative = opinionStats.negative;

    const updatedAgents = [...agents];

    updatedAgents.forEach((agent) => {
      // 基本影響
      const baseInfluence = 0.15 * (1 - agent.certainty);

      // 加入意見領袖效應
      const influence =
        agent.influence > 0.7
          ? baseInfluence * (1 + params.influencerImpact)
          : baseInfluence;

      // 影響意見
      agent.opinion += direction * influence;
      agent.opinion = Math.max(-1, Math.min(1, agent.opinion));

      // 提高確定性
      agent.certainty += 0.05;
      agent.certainty = Math.min(0.95, agent.certainty);

      // 更新顏色
      agent.color =
        agent.opinion > 0.3
          ? "#ff6b6b"
          : agent.opinion < -0.3
          ? "#4dabf7"
          : "#a3a3a3";
    });

    // 更新代理人
    setAgents(updatedAgents);

    // 添加集氣歷史記錄
    setGatheringHistory([
      ...gatheringHistory,
      {
        direction: direction,
        timestamp: Date.now(),
        isDisruption: false,
      },
    ]);

    // 更新觀點統計與顯示動畫
    updateOpinionStats(updatedAgents, true, direction);
  };

  // 發起強力反轉
  const triggerDisruption = (direction) => {
    // 突發事件不能在已經激活的情況下重複觸發
    if (disruptionActive) return;

    // 設置突發事件類型
    setDisruptionType(direction > 0 ? "positive" : "negative");
    setDisruptionActive(true);

    // 記錄突發事件前的數值
    const beforePositive = opinionStats.positive;
    const beforeNegative = opinionStats.negative;

    const updatedAgents = [...agents];

    // 計算突發事件影響係數
    // 在坍縮態中，反向突發事件的影響更大
    let disruptionMultiplier = 1;
    if (
      (collectiveState === "正向坍縮態" && direction < 0) ||
      (collectiveState === "負向坍縮態" && direction > 0)
    ) {
      disruptionMultiplier = 2.5; // 反向突發事件的效力大幅增強
    }

    updatedAgents.forEach((agent) => {
      // 標記受影響代理人
      const isAffected = Math.random() < 0.7; // 70%的代理人受影響

      if (isAffected) {
        agent.disrupted = true;

        // 降低確定性
        agent.certainty *= 0.5;

        // 強力反轉 - 比普通集氣強3-5倍
        const baseInfluence = 0.5; // 基礎影響力提高

        // 意見領袖受影響更大，但也有更強的阻力
        const influence =
          agent.influence > 0.7 ? baseInfluence * 1.5 : baseInfluence;

        // 計算突發事件方向的影響（考慮當前坍縮態的抵抗力）
        let finalInfluence = influence * disruptionMultiplier;

        // 意見反轉 - 更激進的變化
        agent.opinion += direction * finalInfluence;
        agent.opinion = Math.max(-1, Math.min(1, agent.opinion));

        // 更新顏色
        agent.color =
          agent.opinion > 0.3
            ? "#ff6b6b"
            : agent.opinion < -0.3
            ? "#4dabf7"
            : "#a3a3a3";
      }
    });

    // 更新代理人
    setAgents(updatedAgents);

    // 添加突發事件記錄
    setGatheringHistory([
      ...gatheringHistory,
      {
        direction: direction,
        timestamp: Date.now(),
        isDisruption: true,
      },
    ]);

    // 更新觀點統計與顯示動畫
    updateOpinionStats(updatedAgents, true, direction);
  };

  // 重置系統
  const resetSystem = () => {
    initializeAgents();
    setCollectiveState("疊加態");
    setGatheringHistory([]);
    setDisruptionActive(false);
    setDisruptionType(null);
    setDisruptionTime(0);
  };

  return (
    <div className="p-4 bg-gray-100">
      <h1 className="text-xl font-bold text-center mb-2">
        社群集氣的文化量子態視覺化
      </h1>

      {/* 量子狀態與觀點顯示面板 */}
      <div className="bg-white rounded shadow p-3 mb-4">
        <div className="grid grid-cols-3 gap-4">
          {/* 量子狀態 */}
          <div className="text-center">
            <span className="font-semibold">集體量子狀態：</span>
            <span
              className={
                disruptionActive
                  ? "bg-yellow-300 text-red-700 px-2 py-1 rounded animate-pulse font-bold"
                  : collectiveState === "部分坍縮態"
                  ? "bg-gradient-to-r from-red-500 to-blue-500 text-white px-2 py-1 rounded animate-pulse font-bold"
                  : collectiveState.includes("坍縮")
                  ? "text-red-600 font-bold"
                  : ""
              }
            >
              {disruptionActive
                ? disruptionType === "positive"
                  ? "正向突發事件中"
                  : "負向突發事件中"
                : collectiveState}
            </span>
          </div>

          {/* 正向觀點 */}
          <div className="text-center">
            <div className="font-semibold">正向觀點：</div>
            <div className="flex items-center justify-center">
              <div
                className={`text-xl font-bold ${
                  opinionStats.showChangeAnimation &&
                  opinionStats.lastChange.positive > 0
                    ? "text-red-600 animate-pulse"
                    : "text-red-500"
                }`}
              >
                {opinionStats.positive}%
              </div>

              {opinionStats.showChangeAnimation &&
                opinionStats.lastChange.positive > 0 && (
                  <div className="ml-2 text-green-500 font-bold animate-pulse">
                    +{opinionStats.lastChange.positive}%
                  </div>
                )}
            </div>
          </div>

          {/* 負向觀點 */}
          <div className="text-center">
            <div className="font-semibold">負向觀點：</div>
            <div className="flex items-center justify-center">
              <div
                className={`text-xl font-bold ${
                  opinionStats.showChangeAnimation &&
                  opinionStats.lastChange.negative > 0
                    ? "text-blue-600 animate-pulse"
                    : "text-blue-500"
                }`}
              >
                {opinionStats.negative}%
              </div>

              {opinionStats.showChangeAnimation &&
                opinionStats.lastChange.negative > 0 && (
                  <div className="ml-2 text-green-500 font-bold animate-pulse">
                    +{opinionStats.lastChange.negative}%
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* 觀點分布條 */}
        <div className="mt-2 h-4 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 float-left transition-all duration-500 ease-in-out"
            style={{ width: `${opinionStats.positive}%` }}
          ></div>
          <div
            className="h-full bg-gray-400 float-left transition-all duration-500 ease-in-out"
            style={{ width: `${opinionStats.neutral}%` }}
          ></div>
          <div
            className="h-full bg-blue-500 float-left transition-all duration-500 ease-in-out"
            style={{ width: `${opinionStats.negative}%` }}
          ></div>
        </div>
      </div>

      <div className="flex flex-wrap">
        <div className="w-full lg:w-3/4 p-2">
          <div className="bg-white p-3 rounded shadow">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="w-full border border-gray-200"
            />

            <div className="mt-3 flex flex-wrap justify-center gap-3">
              {/* 一般集氣按鈕 */}
              <div className="flex space-x-3">
                <button
                  onClick={() => triggerCollectiveGathering(1)}
                  disabled={disruptionActive}
                  className={`px-3 py-2 rounded bg-red-500 text-white font-bold hover:bg-red-600 transition-all flex items-center ${
                    disruptionActive ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <span className="mr-1 text-lg">🔥</span>
                  <div>
                    <div>正向集氣</div>
                    <div className="text-xs">增加正向觀點</div>
                  </div>
                </button>
                <button
                  onClick={() => triggerCollectiveGathering(-1)}
                  disabled={disruptionActive}
                  className={`px-3 py-2 rounded bg-blue-500 text-white font-bold hover:bg-blue-600 transition-all flex items-center ${
                    disruptionActive ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <span className="mr-1 text-lg">🌊</span>
                  <div>
                    <div>反向集氣</div>
                    <div className="text-xs">增加負向觀點</div>
                  </div>
                </button>
              </div>

              {/* 強力反轉按鈕 */}
              <div className="flex space-x-3">
                <button
                  onClick={() => triggerDisruption(1)}
                  disabled={disruptionActive}
                  className={`px-3 py-2 rounded bg-gradient-to-r from-red-600 to-yellow-500 text-white font-bold hover:from-red-700 hover:to-yellow-600 transition-all flex items-center shadow-lg border-2 border-yellow-400 ${
                    disruptionActive ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <span className="mr-1 text-lg">⚡</span>
                  <div>
                    <div>強力正向反轉</div>
                    <div className="text-xs">突破坍縮狀態</div>
                  </div>
                </button>
                <button
                  onClick={() => triggerDisruption(-1)}
                  disabled={disruptionActive}
                  className={`px-3 py-2 rounded bg-gradient-to-r from-blue-600 to-purple-500 text-white font-bold hover:from-blue-700 hover:to-purple-600 transition-all flex items-center shadow-lg border-2 border-purple-400 ${
                    disruptionActive ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <span className="mr-1 text-lg">⚡</span>
                  <div>
                    <div>強力負向反轉</div>
                    <div className="text-xs">突破坍縮狀態</div>
                  </div>
                </button>
              </div>

              {/* 重置按鈕 */}
              <button
                onClick={resetSystem}
                className="px-3 py-2 rounded bg-gray-500 text-white hover:bg-gray-600 transition-all"
              >
                重置系統
              </button>
            </div>

            {/* 集氣與事件歷史紀錄 */}
            {gatheringHistory.length > 0 && (
              <div className="mt-3 text-sm">
                <div className="font-semibold">事件歷史：</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {gatheringHistory.map((event, index) => (
                    <div
                      key={index}
                      className={`px-2 py-1 rounded ${
                        event.isDisruption
                          ? event.direction > 0
                            ? "bg-gradient-to-r from-red-100 to-yellow-100 text-red-700 border border-yellow-400"
                            : "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border border-purple-400"
                          : event.direction > 0
                          ? "bg-red-100 text-red-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {event.isDisruption
                        ? event.direction > 0
                          ? "⚡ 強力正向反轉"
                          : "⚡ 強力負向反轉"
                        : event.direction > 0
                        ? "🔥 正向集氣"
                        : "🌊 反向集氣"}
                      <span className="text-xs ml-1">
                        {Math.round((Date.now() - event.timestamp) / 1000)}秒前
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-1/4 p-2">
          <div className="bg-white p-3 rounded shadow">
            <h3 className="font-bold mb-2">系統狀態說明</h3>

            {disruptionActive ? (
              <div className="mb-4 p-2 bg-yellow-100 border-l-4 border-yellow-500 rounded">
                <p className="font-bold text-red-700">突發事件進行中</p>
                <p className="text-sm">
                  {disruptionType === "positive"
                    ? "正向突發事件打破了原有平衡，重塑社群意見分布。"
                    : "負向突發事件正強烈衝擊現有共識，引發集體重新評估。"}
                </p>
                <div className="w-full bg-gray-200 h-2 mt-1 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      disruptionType === "positive"
                        ? "bg-red-500"
                        : "bg-blue-500"
                    } transition-all duration-300`}
                    style={{ width: `${disruptionTime / 50}%` }}
                  ></div>
                </div>
              </div>
            ) : collectiveState.includes("坍縮") ? (
              <div className="mb-4 p-2 bg-red-50 border-l-4 border-red-500 rounded">
                <p className="font-bold text-red-700">坍縮狀態警告</p>
                <p className="text-sm">
                  {collectiveState === "正向坍縮態"
                    ? "系統已形成強烈正向共識，對反向意見具有高抵抗力。"
                    : collectiveState === "負向坍縮態"
                    ? "系統已形成強烈負向共識，對正向意見具有高抵抗力。"
                    : "系統正朝向一種主流意見靠攏，但尚未形成完全共識。"}
                </p>
                <p className="text-xs mt-1 italic">
                  {collectiveState.includes("完全")
                    ? "需要強力突發事件才能有效改變當前狀態。"
                    : "仍可通過持續的反向集氣逐漸改變狀態。"}
                </p>
              </div>
            ) : (
              <div className="mb-4 p-2 bg-green-50 border-l-4 border-green-500 rounded">
                <p className="font-bold text-green-700">量子疊加狀態</p>
                <p className="text-sm">
                  系統處於多元觀點共存的狀態，意見分布相對均衡，容易受到集氣影響。
                </p>
              </div>
            )}

            <div className="mb-3">
              <label className="block mb-1">
                量子糾纏強度: {params.entanglementStrength.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={params.entanglementStrength}
                onChange={(e) =>
                  handleParamChange(
                    "entanglementStrength",
                    parseFloat(e.target.value)
                  )
                }
                className="w-full"
              />
            </div>

            <div className="mb-3">
              <label className="block mb-1">
                傳播速度: {params.viralitySpeed.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={params.viralitySpeed}
                onChange={(e) =>
                  handleParamChange("viralitySpeed", parseFloat(e.target.value))
                }
                className="w-full"
              />
            </div>

            <div className="mb-3">
              <label className="block mb-1">
                意見領袖影響力: {params.influencerImpact.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={params.influencerImpact}
                onChange={(e) =>
                  handleParamChange(
                    "influencerImpact",
                    parseFloat(e.target.value)
                  )
                }
                className="w-full"
              />
            </div>

            <div className="mt-4 text-sm">
              <p className="font-semibold">功能說明：</p>
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li>
                  <span className="font-semibold">集氣</span>
                  ：逐步影響系統中的觀點分布
                </li>
                <li>
                  <span className="font-semibold">強力反轉</span>
                  ：模擬突發事件，能打破已形成的坍縮狀態
                </li>
                <li>
                  <span className="font-semibold">坍縮狀態</span>
                  ：系統形成主流意見，對反向影響有抵抗力
                </li>
                <li>
                  <span className="font-semibold">意見領袖</span>(
                  <strong>★</strong>)：有更大影響力的關鍵節點
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
