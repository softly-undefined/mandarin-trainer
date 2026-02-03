import { useState, useEffect } from "react";
import {
    Stack,
    Card,
    Button,
    CloseButton,
    Alert,
} from "react-bootstrap";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useTheme } from "../contexts/ThemeContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function FinishPage(props) {
    const { 
        goToPage,
        responseCounts,
        learnedOverTime,
        currentSetName
    } = props;

    const { isDarkMode } = useTheme();
    const [rightCount, setRightCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);

    useEffect(() => {
        getRightWrong(responseCounts);
    }, [responseCounts]);

    const getRightWrong = (array) => {
        const right = array.filter((v) => v === 1).length;
        const wrong = array.filter((v) => v === 0).length;
        setRightCount(right);
        setWrongCount(wrong);
    };

    const cardStyle = isDarkMode
        ? { backgroundColor: "#23272b", color: "#fff", borderColor: "#444" }
        : {};
    const headerStyle = isDarkMode ? { color: "#fff" } : {};
    const alertStyle = isDarkMode
        ? { backgroundColor: "#181a1b", color: "#fff", border: "1px solid #444" }
        : {};
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: 'Words Learned Over Time',
                color: isDarkMode ? '#fff' : undefined,
            },
        },
        scales: {
            x: {
                min: 0,
                title: {
                    display: true,
                    text: 'Number of Trials',
                    color: isDarkMode ? '#fff' : undefined,
                },
                ticks: {
                    color: isDarkMode ? '#fff' : undefined,
                },
                grid: {
                    color: isDarkMode ? '#444' : undefined,
                },
            },
            y: {
                min: 0,
                title: {
                    display: true,
                    text: 'Words Learned',
                    color: isDarkMode ? '#fff' : undefined,
                },
                beginAtZero: true,
                ticks: {
                    color: isDarkMode ? '#fff' : undefined,
                },
                grid: {
                    color: isDarkMode ? '#444' : undefined,
                },
            },
        },
    };

    return (
        <Card body style={{ width: "400px", ...cardStyle }}>
            <Stack
                direction='horizontal'
                style={{
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                }}
            >
                <Card.Title style={{ flexGrow: 1, ...headerStyle }}>Finished Testing {currentSetName}</Card.Title>
                <CloseButton onClick={() => goToPage("home")} />
            </Stack>

            <Stack gap='3'>
                <Alert variant="success" style={alertStyle}>
                    <div>Correct Answers: {rightCount}</div>
                    <div>Incorrect Answers: {wrongCount}</div>
                    <div>Accuracy: {rightCount + wrongCount > 0 ? 
                        Math.round((rightCount / (rightCount + wrongCount)) * 100) : 0}%</div>
                </Alert>

                {learnedOverTime.length > 0 && (
                    <Line
                        data={{
                            labels: learnedOverTime.map((d) => d.trial),
                            datasets: [
                                {
                                    label: 'Words Learned',
                                    data: learnedOverTime.map((d) => d.learned),
                                    borderColor: 'green',
                                    backgroundColor: 'rgba(0,128,0,0.2)',
                                    tension: 0.3,
                                },
                            ],
                        }}
                        options={chartOptions}
                    />
                )}

                <Button
                    variant='success'
                    onClick={() => {
                        goToPage("home");
                    }}
                >
                    Return Home
                </Button>
            </Stack>
        </Card>
    );
}
