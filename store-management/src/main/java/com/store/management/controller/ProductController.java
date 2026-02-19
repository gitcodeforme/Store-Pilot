package com.store.management.controller;

import com.store.management.dto.ProductDTO;
import com.store.management.model.Product;
import com.store.management.model.Units;
import com.store.management.service.ProductService;
import com.store.management.service.UnitsService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private UnitsService unitsService;

    @Autowired
    private ProductService productService;

    @Operation(summary = "Get all products", description = "Returns a list of all products")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Found all products"),
        @ApiResponse(responseCode = "404", description = "No products found")
    })
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        List<Product> products = productService.getAllProducts();
        if (products.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(products);
    }

    @Operation(summary = "Get a product by ID or name", description = "Returns a single product by ID or name")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Found the product"),
        @ApiResponse(responseCode = "404", description = "Product not found")
    })
    
    
    @GetMapping("/product/{identifier}")
    public ResponseEntity<Product> getProductByIdentifier(@PathVariable String identifier) {
        Optional<Product> productOptional;

        // Try to find by product ID first
        try {
            Integer productId = Integer.parseInt(identifier);
            productOptional = productService.getProductById(productId);
        } catch (NumberFormatException e) {
            // If not a valid product ID, try to find by product code or product name
            productOptional = productService.getProductByCode(identifier);
            if (productOptional.isEmpty()) {
                productOptional = productService.getProductByName(identifier);
            }
        }

        return productOptional.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Create a new product", description = "Creates a new product with provided details")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Product created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input")
    })
    
    @PostMapping("/create")
    public ResponseEntity<?> createProduct(@RequestBody Product productDetails) {
    Optional<Units> unitOpt = unitsService.getUnitByName(productDetails.getUnit().getUnitName());
    if (unitOpt.isEmpty()) {
        return ResponseEntity.badRequest().body("Unit not found: " + productDetails.getUnit().getUnitName());
    }

    Units unit = unitOpt.get();
    productDetails.setUnit(unit);

    Product savedProduct = productService.saveProduct(productDetails);
    return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);
}


    @Operation(summary = "Update an existing product", description = "Updates the product details by ID or product name")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Product updated successfully"),
        @ApiResponse(responseCode = "404", description = "Product not found")
    })
    @PutMapping("/product/{identifier}")
    public ResponseEntity<Product> updateProduct(@PathVariable String identifier, @RequestBody Product productDetails) {
        Optional<Product> productOptional = Optional.empty();

        // Try to find by product ID
        try {
            Integer productId = Integer.parseInt(identifier);
            productOptional = productService.getProductById(productId);
        } catch (NumberFormatException e) {
            // If not a valid product ID, try by product code or product name
            productOptional = productService.getProductByCode(identifier);
            if (productOptional.isEmpty()) {
                productOptional = productService.getProductByName(identifier);
            }
        }

        // If product is found, update it
        return productOptional.map(existingProduct -> {
            existingProduct.setProductCode(productDetails.getProductCode());
            existingProduct.setProductName(productDetails.getProductName());
            existingProduct.setUnit(productDetails.getUnit());
            existingProduct.setQuantity(productDetails.getQuantity());
            existingProduct.setBuyingPrice(productDetails.getBuyingPrice());
            existingProduct.setSellingPriceRetail(productDetails.getSellingPriceRetail());
            existingProduct.setSellingPriceWholesale(productDetails.getSellingPriceWholesale());

            Product updatedProduct = productService.saveProduct(existingProduct);
            return ResponseEntity.ok(updatedProduct);
        }).orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Delete a product", description = "Deletes a product by ID or product name")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Product deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Product not found")
    })
    @DeleteMapping("/delete/{identifier}")
    public ResponseEntity<Void> deleteProductByIdentifier(@PathVariable String identifier) {
        Optional<Product> optionalProduct = Optional.empty();

        // Try to find the product by ID
        try {
            Integer id = Integer.parseInt(identifier);
            optionalProduct = productService.getProductById(id);
        } catch (NumberFormatException e) {
            // If not an integer (i.e., it's productCode or productName), try by productCode and productName
            optionalProduct = productService.getProductByCode(identifier);
            if (optionalProduct.isEmpty()) {
                optionalProduct = productService.getProductByName(identifier);
            }
        }

        if (optionalProduct.isPresent()) {
            productService.deleteProduct(optionalProduct.get().getProductId());
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
