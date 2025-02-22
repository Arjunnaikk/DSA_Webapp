package com.example.demo.bubbleSort;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sort/bubble")
@CrossOrigin(origins = "*")

public class BubbleSortController {
    
    @Autowired
    private BubbleSortService sortService;

    @PostMapping("/init")
    public SortResponse initializeSort(@RequestBody SortRequest request) {
        return sortService.initSort(request);
         
    }

    @GetMapping("/steps")
    public List<SortState> getAllSteps() {
        return sortService.getAllSteps();
    }

    @GetMapping("/step/{stepNumber}")
    public StepResponse getStepByNumber(@PathVariable int stepNumber) {
            return sortService.getStep(stepNumber);
    }
}
