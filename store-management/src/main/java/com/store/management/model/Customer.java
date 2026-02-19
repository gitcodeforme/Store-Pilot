package com.store.management.model;
import java.math.BigInteger;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private BigInteger customerId;

    @Column(name = "customer_code", unique = true)
    private String customerCode;

    private String customerName;

    private String mobileNumber;

    @Lob
    private String address;
}

