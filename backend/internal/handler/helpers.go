package handler

import (
	"fmt"
	"math"
	"math/big"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// parseUUID parses a string into a pgtype.UUID
func parseUUID(s string) (pgtype.UUID, error) {
	id, err := uuid.Parse(s)
	if err != nil {
		return pgtype.UUID{}, fmt.Errorf("invalid UUID: %s", s)
	}
	return pgtype.UUID{Bytes: id, Valid: true}, nil
}

// numericToFloat converts pgtype.Numeric to float64
func numericToFloat(n pgtype.Numeric) (float64, error) {
	if !n.Valid {
		return 0, nil
	}
	if n.Int == nil {
		return 0, nil
	}

	// Convert big.Int to float64 and apply exponent
	f := new(big.Float).SetInt(n.Int)
	exp := math.Pow(10, float64(n.Exp))
	result, _ := f.Mul(f, new(big.Float).SetFloat64(exp)).Float64()
	return result, nil
}
