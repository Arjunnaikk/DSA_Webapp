package com.example.demo.insertionSort;

import java.util.List;
import lombok.Data;

@Data
public class SortState {
    private int[] array;
    private int currentIndex;
    private int comparingIndex;
    private List<Integer> sortedIndices;
    private boolean isCompleted;
    private int[] initialArray;
    private String animation;

    // Getters and setters
    public int[] getArray() {
        return array;
    }

    public void setArray(int[] array) {
        this.array = array;
    }

    public int getCurrentIndex() {
        return currentIndex;
    }

    public void setCurrentIndex(int currentIndex) {
        this.currentIndex = currentIndex;
    }

    public int getComparingIndex() {
        return comparingIndex;
    }

    public void setComparingIndex(int comparingIndex) {
        this.comparingIndex = comparingIndex;
    }

    public List<Integer> getSortedIndices() {
        return sortedIndices;
    }

    public void setSortedIndices(List<Integer> sortedIndices) {
        this.sortedIndices = sortedIndices;
    }

    public boolean isCompleted() {
        return isCompleted;
    }

    public void setCompleted(boolean completed) {
        isCompleted = completed;
    }

    public int[] getInitialArray() {
        return initialArray;
    }

    public void setInitialArray(int[] initialArray) {
        this.initialArray = initialArray;
    }

    public String getAnimation() {
        return animation;
    }

    public void setAnimation(String animation) {
        this.animation = animation;
    }
}