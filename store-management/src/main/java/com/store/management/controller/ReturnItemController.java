package com.store.management.controller;

import com.store.management.dto.ReturnItemDTO;
import com.store.management.service.ReturnItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/return-items")
public class ReturnItemController {

    @Autowired
    private ReturnItemService returnItemService;

    @GetMapping
    public List<ReturnItemDTO> getAllReturnItems() {
        return returnItemService.getAllReturnItems();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReturnItemDTO> getReturnItemById(@PathVariable Integer id) {
        return returnItemService.getReturnItemById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/return/{returnId}")
    public List<ReturnItemDTO> getReturnItemsByReturnId(@PathVariable Integer returnId) {
        return returnItemService.getReturnItemsByReturnId(returnId);
    }

    @GetMapping("/product/{productId}")
    public List<ReturnItemDTO> getReturnItemsByProductId(@PathVariable Integer productId) {
        return returnItemService.getReturnItemsByProductId(productId);
    }

    @PostMapping("/create")
    public ResponseEntity<ReturnItemDTO> createReturnItem(@RequestBody ReturnItemDTO dto) {
        // Call the service layer to save the return item
        ReturnItemDTO createdReturnItem = returnItemService.saveReturnItem(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdReturnItem);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReturnItemDTO> updateReturnItem(@PathVariable Integer id, @RequestBody ReturnItemDTO dto) {
        returnItemService.getReturnItemById(id)
            .orElseThrow(() -> new RuntimeException("ReturnItem not found"));
        dto.setReturnItemId(id);
        ReturnItemDTO updated = returnItemService.saveReturnItem(dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReturnItem(@PathVariable Integer id) {
        if (returnItemService.getReturnItemById(id).isPresent()) {
            returnItemService.deleteReturnItem(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
