package com.example.demo.bubbleSort;

import org.springframework.stereotype.Service;
import lombok.Data;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Data
class SortState {
    private int[] array;
    private int swapIndex;
    private int comparingIndex;
    private List<Integer> sortedIndices;
    private boolean isCompleted;
    private int[] initialArray;
    private String animation;

    // Getters
    public int[] getArray() {
        return array;
    }

    public int getSwapIndex() {
        return swapIndex;
    }

    public int getComparingIndex() {
        return comparingIndex;
    }

    public List<Integer> getSortedIndices() {
        return sortedIndices;
    }

    public boolean getIsCompleted() {
        return isCompleted;
    }

    public int[] getInitialArray() {
        return initialArray;
    }

    public String getAnimation() {
        return animation;
    }

    // Setters
    public void setArray(int[] array) {
        this.array = array;
    }

    public void setSwapIndex(int swapIndex) {
        this.swapIndex = swapIndex;
    }

    public void setComparingIndex(int comparingIndex) {
        this.comparingIndex = comparingIndex;
    }

    public void setSortedIndices(List<Integer> sortedIndices) {
        this.sortedIndices = sortedIndices;
    }

    public void setIsCompleted(boolean isCompleted) {
        this.isCompleted = isCompleted;
    }

    public void setInitialArray(int[] initialArray) {
        this.initialArray = initialArray;
    }

    public void setAnimation(String animation) {
        this.animation = animation;
    }
}
