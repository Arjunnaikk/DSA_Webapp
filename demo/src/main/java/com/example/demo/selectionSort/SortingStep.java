package com.example.demo.selectionSort;
import lombok.Data;

@Data
public class SortingStep {
    private int[] array;
    private int currentIndex;
    private boolean reset;
}