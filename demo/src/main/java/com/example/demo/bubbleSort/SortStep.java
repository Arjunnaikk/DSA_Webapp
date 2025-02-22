package com.example.demo.bubbleSort;

import lombok.Data;

@Data
public class SortStep {
    private int[] array;
    private int currentIndex;
    private boolean reset;
}

