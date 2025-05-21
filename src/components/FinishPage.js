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

    return (
        <Card body style={{ width: "400px" }}>
            <Stack
                direction='horizontal'
                style={{
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                }}
            >
                <Card.Title style={{ flexGrow: 1 }}>Finished Testing {currentSetName}</Card.Title>
                <CloseButton onClick={() => goToPage("menu")} />
            </Stack>

            <Stack gap='3'>
                <Alert variant="success">
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
                        options={{
                            responsive: true,
                            plugins: {
                                legend: { display: false },
                                title: {
                                    display: true,
                                    text: 'Words Learned Over Time',
                                },
                            },
                            scales: {
                                x: {
                                    min: 0,
                                    title: {
                                        display: true,
                                        text: 'Number of Trials',
                                    },
                                },
                                y: {
                                    min: 0,
                                    title: {
                                        display: true,
                                        text: 'Words Learned',
                                    },
                                    beginAtZero: true,
                                },
                            },
                        }}
                    />
                )}

                <Button
                    variant='success'
                    onClick={() => {
                        goToPage("menu");
                    }}
                >
                    Return Home
                </Button>
            </Stack>
        </Card>
    );
}
