package com.store.management.controller;

import com.store.management.dto.ProductDTO;
import com.store.management.dto.SaleItemDTO;
import com.store.management.model.SaleItem;
import com.store.management.service.SaleItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/sale-items")
public class SaleItemController {

    @Autowired
    private SaleItemService saleItemService;

    @GetMapping
    public List<SaleItemDTO> getAllSaleItems() {
        return saleItemService.getAllSaleItems();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SaleItemDTO> getSaleItemById(@PathVariable Integer id) {
        return saleItemService.getSaleItemById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/product/{productId}")
    public List<SaleItemDTO> getSaleItemsByProductId(@PathVariable Integer productId) {
        return saleItemService.getSaleItemsByProductId(productId);
    }

    @PostMapping("create/{saleId}/{productId}/{productCode}/{quantity}/{price}/{totalPrice}")
public ResponseEntity<SaleItemDTO> createSaleItem(
        @PathVariable Integer saleId,
        @PathVariable BigInteger productId,
        @PathVariable String productCode,
        @PathVariable BigDecimal quantity,
        @PathVariable BigDecimal price,
        @PathVariable BigDecimal totalPrice
) {
    SaleItemDTO dto = new SaleItemDTO();
    dto.setPrice(price);
    dto.setQuantity(quantity);
    dto.setTotalPrice(totalPrice);

    ProductDTO product = new ProductDTO();
    product.setProductId(productId.intValue());
    dto.setProduct(product);

    SaleItemDTO createdSaleItem = saleItemService.saveSaleItem(dto, saleId);
    return ResponseEntity.status(201).body(createdSaleItem);
}


    @PutMapping("/update/{identifier}")
public ResponseEntity<SaleItemDTO> updateSaleItemByIdentifier(
        @PathVariable String identifier,
        @RequestBody SaleItemDTO dto) {

    Optional<SaleItem> existing = saleItemService.getByIdentifier(identifier);
    if (existing.isEmpty()) {
        return ResponseEntity.notFound().build();
    }

    // Set the found SaleItem's ID to DTO
    dto.setSaleItemId(existing.get().getItemId());
    SaleItemDTO updated = saleItemService.saveSaleItem(dto, existing.get().getSale().getSaleId());
    return ResponseEntity.ok(updated);
}


    @DeleteMapping("/delete/{identifier}")
public ResponseEntity<Void> deleteSaleItemByIdentifier(@PathVariable String identifier) {
    boolean deleted = saleItemService.deleteByIdentifier(identifier);
    return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
}

}
