"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ALGORITHM_CATEGORIES, SAMPLE_QUESTIONS } from "@/lib/constants";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export default function TestPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [testStarted, setTestStarted] = useState(false);

    const filteredQuestions = SAMPLE_QUESTIONS.filter(
        (q) => q.category === selectedCategory
    );

    const handleAnswerSelect = (answerIndex: number) => {
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestion] = answerIndex;
        setSelectedAnswers(newAnswers);
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const handleNext = () => {
        if (currentQuestion < filteredQuestions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            setShowResults(true);
        }
    };

    const startTest = () => {
        setTestStarted(true);
        setCurrentQuestion(0);
        setSelectedAnswers([]);
        setShowResults(false);
    };

    const correctAnswers = selectedAnswers.filter(
        (answer, index) => answer === filteredQuestions[index].correctAnswer
    ).length;

    const progress = ((currentQuestion + 1) / filteredQuestions.length) * 100;

    if (!testStarted) {
        return (
            <div className="container px-4 py-16">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl text-center">Choose a Topic</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Select onValueChange={setSelectedCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {ALGORITHM_CATEGORIES.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex justify-center">
                            <Button
                                onClick={startTest}
                                disabled={!selectedCategory}
                                size="lg"
                                className="bg-gradient-to-r from-purple-500 to-pink-500"
                            >
                                Start Test
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (showResults) {
        const resultData = [
            {
                name: 'Correct',
                value: correctAnswers,
                fill: '#10b981' // green
            },
            {
                name: 'Incorrect',
                value: filteredQuestions.length - correctAnswers,
                fill: '#ef4444' // red
            }
        ];

        const categoryData = ALGORITHM_CATEGORIES.find(c => c.id === selectedCategory);
        const categoryTitle = categoryData ? categoryData.title : selectedCategory;

        return (
            <div className="container px-4 py-16">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl text-center">Test Results: {categoryTitle}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-8 mb-8">
                            <div className="text-center p-6 rounded-lg bg-muted/50">
                                <p className="text-4xl font-bold mb-2">
                                    {Math.round((correctAnswers / filteredQuestions.length) * 100)}%
                                </p>
                                <p className="text-muted-foreground">
                                    You got {correctAnswers} out of {filteredQuestions.length} questions correct
                                </p>
                            </div>

                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={resultData}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" domain={[0, filteredQuestions.length]} />
                                        <YAxis dataKey="name" type="category" />
                                        <Tooltip
                                            formatter={(value) => [`${value} questions`, '']}
                                            labelFormatter={(label) => `${label}:`}
                                        />
                                        <Bar
                                            dataKey="value"
                                            name="Questions"
                                            label={{ position: 'right' }}
                                        >
                                            {resultData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {filteredQuestions.map((question, index) => (
                                <div key={question.id} className="p-6 rounded-lg bg-muted/50">
                                    <div className="flex items-start gap-4">
                                        {selectedAnswers[index] === question.correctAnswer ? (
                                            <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                                        ) : (
                                            <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                                        )}
                                        <div>
                                            <h3 className="font-medium mb-2">{question.question}</h3>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Your answer: {question.options[selectedAnswers[index]]}
                                                {selectedAnswers[index] !== question.correctAnswer && (
                                                    <span className="block text-green-600 dark:text-green-400">
                                                        Correct answer: {question.options[question.correctAnswer]}
                                                    </span>
                                                )}
                                            </p>
                                            <Alert>
                                                <AlertDescription>
                                                    {question.explanation}
                                                </AlertDescription>
                                            </Alert>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-center gap-4">
                            <Button
                                variant="outline"
                            >
                                <Link href="/">Back to home page</Link>
                            </Button>

                            <Button
                                className="bg-gradient-to-r from-purple-500 to-pink-500"
                            >
                                <Link href="/">Retry Test</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container px-4 py-16">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                        <CardTitle>Algorithm Knowledge Test</CardTitle>
                        {filteredQuestions.length > 0 && (
                            <span className="text-sm text-muted-foreground">
                                Question {currentQuestion + 1} of {filteredQuestions.length}
                            </span>
                        )}
                    </div>
                    {filteredQuestions.length > 0 && (
                        <Progress value={progress} className="h-2" />
                    )}
                </CardHeader>
                <CardContent>
                    {filteredQuestions.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">
                                {selectedCategory 
                                    ? "No questions found for this category" 
                                    : "Please select a category to start the test"}
                            </p>
                            <Button 
                                onClick={() => setTestStarted(false)}
                                variant="outline"
                            >
                                Back to Categories
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-8">
                                <h3 className="text-xl font-semibold mb-4">
                                    {filteredQuestions[currentQuestion].question}
                                </h3>
                                <div className="space-y-4">
                                    {filteredQuestions[currentQuestion].options.map((option, index) => (
                                        <Button
                                            key={index}
                                            variant={selectedAnswers[currentQuestion] === index ? "default" : "outline"}
                                            className="w-full justify-start text-left"
                                            onClick={() => handleAnswerSelect(index)}
                                        >
                                            {option}
                                        </Button>
                                    ))}
                                </div>
                            </div>
    
                            <div className="flex justify-between">
                                <Button
                                    variant="outline"
                                    onClick={handlePrevious}
                                    disabled={currentQuestion === 0}
                                >
                                    Previous
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    disabled={selectedAnswers[currentQuestion] === undefined}
                                    className="bg-gradient-to-r from-purple-500 to-pink-500"
                                >
                                    {currentQuestion === filteredQuestions.length - 1 ? "Finish" : "Next"}
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}