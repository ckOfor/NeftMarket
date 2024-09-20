;; Define constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-in-escrow (err u101))
(define-constant err-unauthorized (err u102))

;; Define data maps
(define-map escrow-balances
  { sale-id: uint }
  { buyer: principal, seller: principal, amount: uint }
)

;; Define public functions

;; Deposit funds into escrow
(define-public (deposit-escrow (sale-id uint) (seller principal) (amount uint))
  (let
    (
      (escrow-entry { buyer: tx-sender, seller: seller, amount: amount })
    )
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (ok (map-set escrow-balances { sale-id: sale-id } escrow-entry))
  )
)

;; Release funds to seller
(define-public (release-to-seller (sale-id uint))
  (let
    (
      (escrow-info (unwrap! (map-get? escrow-balances { sale-id: sale-id }) err-not-in-escrow))
    )
    (asserts! (or (is-eq tx-sender contract-owner) (is-eq tx-sender (get buyer escrow-info))) err-unauthorized)
    (try! (as-contract (stx-transfer? (get amount escrow-info) tx-sender (get seller escrow-info))))
    (map-delete escrow-balances { sale-id: sale-id })
    (ok true)
  )
)

;; Refund buyer
(define-public (refund-buyer (sale-id uint))
  (let
    (
      (escrow-info (unwrap! (map-get? escrow-balances { sale-id: sale-id }) err-not-in-escrow))
    )
    (asserts! (or (is-eq tx-sender contract-owner) (is-eq tx-sender (get seller escrow-info))) err-unauthorized)
    (try! (as-contract (stx-transfer? (get amount escrow-info) tx-sender (get buyer escrow-info))))
    (map-delete escrow-balances { sale-id: sale-id })
    (ok true)
  )
)

;; Get escrow info
(define-read-only (get-escrow-info (sale-id uint))
  (ok (map-get? escrow-balances { sale-id: sale-id }))
)

;; Check if funds are in escrow
(define-read-only (is-in-escrow (sale-id uint))
  (is-some (map-get? escrow-balances { sale-id: sale-id }))
)
