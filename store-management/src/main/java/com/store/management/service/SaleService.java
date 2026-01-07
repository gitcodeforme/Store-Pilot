package com.store.management.service;

import com.store.management.dto.SaleDTO;
import com.store.management.dto.CustomerDTO;
import com.store.management.dto.ProductDTO;
import com.store.management.dto.SaleItemDTO;
import com.store.management.model.Sale;
import com.store.management.model.SaleItem;
import com.store.management.model.Customer;
import com.store.management.model.Product;
import com.store.management.repository.CustomerRepository;
import com.store.management.repository.ProductRepository;
import com.store.management.repository.SaleRepository;

import lombok.RequiredArgsConstructor;
import java.math.BigDecimal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigInteger;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SaleService {

    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private SaleRepository saleRepository;
    @Autowired
    private CustomerRepository customerRepository;

    public SaleDTO saveSale(SaleDTO dto) {
        Sale sale = toEntity(dto);
        Sale saved = saleRepository.save(sale);

         // After saving sale, update product quantities
      saved.getItems().forEach(saleItem -> {
        Product product = productRepository.findById(saleItem.getProduct().getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        BigDecimal currentQty = product.getQuantity();    // BigDecimal
        BigDecimal soldQty = saleItem.getQuantity();// assuming saleItem.getQuantity() is int

        BigDecimal newQty = currentQty.subtract(soldQty);

        if (newQty.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Insufficient stock for product: " + product.getProductName());
        }

        product.setQuantity(newQty);
        productRepository.save(product);
    });

        return toDTO(saved);
    }
    

    private Sale toEntity(SaleDTO dto) {
        Customer customer = customerRepository.findById(dto.getCustomer().getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found"));
    
        Sale sale = Sale.builder()
                .saleId(null) // Let the DB generate it (ignore dto.getSaleId())
                .customer(customer)
                .saleDate(dto.getSaleDate() != null ? dto.getSaleDate() : LocalDateTime.now())
                .paymentMode(dto.getPaymentMode()) // if using enum in DTO
                .saleType(dto.getSaleType())       // if using enum in DTO
                .grossTotal(dto.getGrossTotal())
                .build();
    
        // Now map and attach saleItems properly
        List<SaleItem> saleItems = dto.getItems().stream()
                .map(saleItemDTO -> {
                    Product product = productRepository.findById(saleItemDTO.getProduct().getProductId())
                            .orElseThrow(() -> new RuntimeException("Product not found"));
    
                    return SaleItem.builder()
                            .sale(sale) //  THIS IS CRUCIAL
                            .product(product)
                            .quantity(saleItemDTO.getQuantity())
                            .price(saleItemDTO.getPrice())
                            .totalPrice(saleItemDTO.getTotalPrice())
                            .build();
                })
                .collect(Collectors.toList());
    
        sale.setItems(saleItems); // Attach items to the sale
    
        return sale;
    }

    private <E extends Enum<E>> E toEnum(Class<E> enumClass, String value) {
        for (E constant : enumClass.getEnumConstants()) {
            if (constant.name().equalsIgnoreCase(value)) {
                return constant;
            }
        }
        throw new IllegalArgumentException("No enum constant " + enumClass.getName() + "." + value);
    }

    private SaleDTO toDTO(Sale sale) {
    List<SaleItemDTO> saleItemDTOs = sale.getItems().stream()
            .map(saleItem -> SaleItemDTO.builder()
                    .saleItemId(saleItem.getItemId())
                    .product(ProductDTO.builder()
                            .productId(saleItem.getProduct().getProductId())
                            .productCode(saleItem.getProduct().getProductCode())
                            .productName(saleItem.getProduct().getProductName())
                            .build())
                    .quantity(saleItem.getQuantity())
                    .price(saleItem.getPrice())
                    .totalPrice(saleItem.getTotalPrice())
                    .build())
            .collect(Collectors.toList());

    CustomerDTO customerDTO = null;

    if (sale.getCustomer() != null) {
        customerDTO = CustomerDTO.builder()
                .customerId(BigInteger.valueOf(sale.getCustomer().getCustomerId().longValue()))
                .customerName(sale.getCustomer().getCustomerName())
                .mobileNumber(sale.getCustomer().getMobileNumber())
                .address(sale.getCustomer().getAddress())
                .build();
    }

    return SaleDTO.builder()
            .saleId(sale.getSaleId())
            .customer(customerDTO)   // ✅ SAFE
            .saleDate(sale.getSaleDate())
            .paymentMode(sale.getPaymentMode())
            .saleType(sale.getSaleType())
            .grossTotal(sale.getGrossTotal())
            .items(saleItemDTOs)
            .build();
}


    public List<SaleDTO> findByIdentifier(String identifier) {
        List<Sale> sales;
    
        // Match numeric saleId
        try {
            Integer id = Integer.parseInt(identifier);
            Optional<Sale> sale = saleRepository.findById(id);
            return sale.map(s -> List.of(toDTO(s))).orElse(List.of());
        } catch (NumberFormatException ignored) {}
    
        // Match PaymentMode (enum)
        try {
            Sale.PaymentMode paymentMode = Sale.PaymentMode.valueOf(identifier.toUpperCase());
            sales = saleRepository.findByPaymentMode(paymentMode);
        } 
        // Match SaleType (enum)
        catch (IllegalArgumentException e1) {
            try {
                Sale.SaleType saleType = Sale.SaleType.valueOf(identifier.toUpperCase());
                sales = saleRepository.findBySaleType(saleType);
            } 
            // Else treat it as Customer Code
            catch (IllegalArgumentException e2) {
                sales = saleRepository.findByCustomer_CustomerNameContainingIgnoreCase(identifier);
            }
        }
    
        return sales.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public Optional<SaleDTO> findSingleByIdentifier(String identifier) {
        try {
            Integer id = Integer.parseInt(identifier);
            return saleRepository.findById(id).map(this::toDTO);
        } catch (NumberFormatException ignored) {}
    
        try {
            Sale.PaymentMode paymentMode = Sale.PaymentMode.valueOf(identifier.toUpperCase());
            return saleRepository.findByPaymentMode(paymentMode).stream().findFirst().map(this::toDTO);
        } catch (IllegalArgumentException ignored) {}
    
        try {
            Sale.SaleType saleType = Sale.SaleType.valueOf(identifier.toUpperCase());
            return saleRepository.findBySaleType(saleType).stream().findFirst().map(this::toDTO);
        } catch (IllegalArgumentException ignored) {}
    
        return saleRepository.findByCustomer_CustomerNameContainingIgnoreCase(identifier).stream().findFirst().map(this::toDTO);
    }

    public List<SaleDTO> getAllSales() {
        return saleRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public Optional<SaleDTO> getSaleById(Integer saleId) {
        return saleRepository.findById(saleId).map(this::toDTO);
    }

    public List<SaleDTO> getSalesBySaleType(String saleType) {
        return saleRepository.findBySaleType(Sale.SaleType.valueOf(saleType)).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<SaleDTO> getSalesByPaymentMode(String paymentMode) {
        return saleRepository.findByPaymentMode(Sale.PaymentMode.valueOf(paymentMode)).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public void deleteSale(Integer saleId) {
        saleRepository.deleteById(saleId);
    }

    public Optional<SaleDTO> findFirstMatchByIdentifier(String identifier) {
        try {
            Integer id = Integer.parseInt(identifier);
            return saleRepository.findById(id).map(this::toDTO);
        } catch (NumberFormatException ignored) {}

        try {
            Sale.PaymentMode paymentMode = Sale.PaymentMode.valueOf(identifier.toUpperCase());
            return saleRepository.findByPaymentMode(paymentMode).stream().findFirst().map(this::toDTO);
        } catch (IllegalArgumentException ignored) {}

        try {
            Sale.SaleType saleType = Sale.SaleType.valueOf(identifier.toUpperCase());
            return saleRepository.findBySaleType(saleType).stream().findFirst().map(this::toDTO);
        } catch (IllegalArgumentException ignored) {}

        return saleRepository.findByCustomer_CustomerNameContainingIgnoreCase(identifier).stream().findFirst().map(this::toDTO);
    }

}
