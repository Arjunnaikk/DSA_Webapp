package com.example.demo.selectionSort;

import java.util.List;
import lombok.Data;

@Data
public class SortingState {
    private List<Integer> array;
    private int currentIndex;
    private int minIndex;
    private List<Integer> sortedIndices;
    private boolean isCompleted;
    private List<Integer> initialArray;
    private int currentLine;

    public SortingState(List<Integer> array, int currentIndex, int minIndex, 
    List<Integer> sortedIndices, boolean isCompleted, List<Integer>  initialArray, int currentLine) {
this.array = array;
this.currentIndex = currentIndex;
this.minIndex = minIndex;
this.sortedIndices = sortedIndices;
this.isCompleted = isCompleted;
this.initialArray = initialArray;
this.currentLine = currentLine;
}

public SortingState() {}

}