import axios from 'axios';
import Draggable from 'react-draggable';
import { PALETTE } from '@/assets/ColorPalette.ts';
import {Button, ColorSwatch, Group} from "@mantine/core";
import React, {useEffect, useRef, useState} from "react";

interface Response {
    expr: string;
    result: string;
    assign: boolean;
}

interface GeneratedExpression {
    expression: string;
    answer: string;
}

export default function Home() {

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [color, setColor] = useState('#9c27b0');
    const [variables, setVariables] = useState({});
    const [isDrawing, setIsDrawing] = useState(false);
    const [resetCanvas, setResetCanvas] = useState(false);
    const [result, setResult] = useState<GeneratedExpression>();
    const [generatedExpression, setGeneratedExpression] = useState<Array<string>>([]);
    const [generatedPosition, setGeneratedPosition] = useState({ x: 10, y: 100 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const context = canvas.getContext('2d');
            if (context) {
                context.lineWidth = 3;
                context.lineCap = 'round';
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
            window.MathJax.Hub.Config({
                tex2jax: {inlineMath: [['$', '$'], ['\\(', '\\)']]},
            });
        };

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    useEffect(() => {
        if (resetCanvas) {
            setVariables({});
            setResult(undefined);
            resetCanvasHandler();
            setResetCanvas(false);
            setGeneratedExpression([]);
        }
    }, [resetCanvas]);

    useEffect(() => {
        if (result) {
            renderExpressionOnCanvas(result.expression, result.answer);
        }
    }, [result]);

    useEffect(() => {
        if (generatedExpression.length > 0 && window.MathJax) {
            setTimeout(() => {
                window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub])
            }, 0);
        }
    }, [generatedExpression]);

    const resetCanvasHandler = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const context = canvas.getContext('2d');
            if (context) {
                context.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const renderExpressionOnCanvas = (expression : string, answer : string) => {
        const temporaryExpression = `\\(\\LARGE{${expression} = ${answer}}\\)`;
        setGeneratedExpression([...generatedExpression, temporaryExpression]);
        const canvas = canvasRef.current;
        if (canvas) {
            const context = canvas.getContext('2d');
            if (context) {
                context.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const startedDrawing = (event : React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.style.background = '#212121';
            const context = canvas.getContext('2d');
            if (context) {
                context.beginPath();
                context.moveTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
            }
            setIsDrawing(true);
        }
    };

    const stoppedDrawing = () => {
        setIsDrawing(false);
    };

    const drawing = (event : React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) {
            return;
        }
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (context) {
            context.strokeStyle = color;
            context.lineTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
            context.stroke();
        }
    };

    const dataServiceHandler = async () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const response = await axios({
                method: 'post',
                url: `${import.meta.env.VITE_API_URL}/calculate`,
                data: {
                    image: canvas.toDataURL('image/png'),
                    variables: variables
                }
            });

            const result = await response.data;
            result.data.forEach((data : Response) => {
                if (data.assign === true) {
                    setVariables({
                        ...variables,
                        [data.expr]: data.result
                    });
                }
            });

            const context = canvas.getContext('2d');
            const imageData = context?.getImageData(0, 0, canvas.width, canvas.height);
            let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;

            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const i = (y * canvas.width + x) * 4;
                    if (imageData && imageData.data[i + 3] > 0) {
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                }
            }

            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            setGeneratedPosition({ x: centerX, y: centerY });
            result.data.forEach((data: Response) => {
                setTimeout(() => {
                    setResult({
                        expression: data.expr,
                        answer: data.result
                    });
                }, 1000);
            });
        }
    };

    return (
        <>
            <div className='grid grid-cols-3 gap-2 mt-1' style={{backgroundColor: '#212121'}}>
                <Button
                    className='z-20 text-white'
                    style={{backgroundColor: '#212121'}}
                    onClick={() => setResetCanvas(true)}>
                    Reset
                </Button>
                <Group
                    className='z-20'
                    style={{justifySelf: 'center'}}
                >
                    {PALETTE.map((chosenColor : string) => (
                        <ColorSwatch
                            key={chosenColor}
                            color={chosenColor}
                            onClick={() => setColor(chosenColor)}
                        />
                    ))}
                </Group>
                <Button
                    className='z-20 text-white'
                    style={{backgroundColor: '#212121'}}
                    onClick={dataServiceHandler}>
                    Generate
                </Button>
            </div>
            <canvas
                id='canvas'
                ref={canvasRef}
                onMouseMove={drawing}
                onMouseUp={stoppedDrawing}
                onMouseOut={stoppedDrawing}
                onMouseDown={startedDrawing}
                style={{backgroundColor: '#212121'}}
                className='absolute top-0 left-0 w-full h-full'
            />
            {generatedExpression && generatedExpression.map((expression : string, index : number) => (
                <Draggable
                key={index}
                defaultPosition={generatedPosition}
                onStop={(event, data) => {setGeneratedPosition({ x: data.x, y: data.y })}}
                >
                    <div className='absolute text-white'>
                        <div className='generated-expressio-content'>{expression}</div>
                    </div>
                </Draggable>
            ))}
        </>
    );

}