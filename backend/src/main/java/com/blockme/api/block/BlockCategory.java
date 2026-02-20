package com.blockme.api.block;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "block_category")
@Data
public class BlockCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;
}