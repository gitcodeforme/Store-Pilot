package com.store.management.controller;

import com.store.management.model.ProductStockLog;
import com.store.management.model.ProductStockLog.TransactionType;
import com.store.management.service.ProductStockLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigInteger;
import java.util.List;

@RestController
@RequestMapping("/api/product-stock-logs")
public class ProductStockLogController {

    @Autowired
    private ProductStockLogService productStockLogService;

    @GetMapping
    public List<ProductStockLog> getAllLogs() {
        return productStockLogService.getAllLogs();
    }

    @GetMapping("/{logId}")
    public ResponseEntity<ProductStockLog> getLogById(@PathVariable BigInteger logId) {
        return productStockLogService.getLogById(logId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/product/{productId}")
    public List<ProductStockLog> getLogsByProductId(@PathVariable Integer productId) {
        return productStockLogService.getLogsByProductId(productId);
    }

    @GetMapping("/transaction-type/{type}")
    public List<ProductStockLog> getLogsByTransactionType(@PathVariable TransactionType type) {
        return productStockLogService.getLogsByTransactionType(type);
    }

    @PostMapping
    public ProductStockLog createLog(@RequestBody ProductStockLog log) {
        return productStockLogService.saveLog(log);
    }

    @DeleteMapping("/{logId}")
    public ResponseEntity<Void> deleteLog(@PathVariable BigInteger logId) {
        if (productStockLogService.getLogById(logId).isPresent()) {
            productStockLogService.deleteLog(logId);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
