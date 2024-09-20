;; Define constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-creator (err u101))
(define-constant err-invalid-percentage (err u102))
(define-constant err-token-not-found (err u103))

;; Define data variables
(define-data-var marketplace-commission uint u250) ;; 2.5% represented as basis points

;; Define data maps
(define-map token-royalties
  { token-id: uint }
  { creator: principal, royalty-percentage: uint }
)

(define-map creator-balances principal uint)

;; Set royalty for a token
(define-public (set-royalty (token-id uint) (royalty-percentage uint))
  (let
    (
      (token-creator (unwrap! (map-get? token-royalties { token-id: token-id }) (err u0)))
    )
    (asserts! (is-eq tx-sender (get creator token-creator)) err-not-token-creator)
    (asserts! (<= royalty-percentage u1000) err-invalid-percentage) ;; Max 10% royalty
    (map-set token-royalties
             { token-id: token-id }
             { creator: tx-sender, royalty-percentage: royalty-percentage })
    (ok true)
  )
)

;; Distribute royalty and take commission
(define-public (distribute-royalty-and-commission (token-id uint) (sale-price uint))
  (let
    (
      (royalty-info (unwrap! (map-get? token-royalties { token-id: token-id }) (err u0)))
      (creator (get creator royalty-info))
      (royalty-percentage (get royalty-percentage royalty-info))
      (royalty-amount (/ (* sale-price royalty-percentage) u10000))
      (commission-amount (/ (* sale-price (var-get marketplace-commission)) u10000))
      (seller-amount (- sale-price (+ royalty-amount commission-amount)))
    )
    ;; Assume transfers succeed for simplicity
    ;; Actual transfers would need to be handled by your transaction logic
    (map-set creator-balances creator (+ (default-to u0 (map-get? creator-balances creator)) royalty-amount))
    (ok seller-amount)
  )
)

;; Withdraw creator balance
(define-public (withdraw-creator-balance)
  (let
    (
      (balance (default-to u0 (map-get? creator-balances tx-sender)))
    )
    (asserts! (> balance u0) (err u103))
    ;; Assume transfer succeeds
    (map-set creator-balances tx-sender u0)
    (ok balance)
  )
)

;; Set marketplace commission
(define-public (set-marketplace-commission (new-commission uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (asserts! (<= new-commission u1000) err-invalid-percentage) ;; Max 10% commission
    (ok (var-set marketplace-commission new-commission))
  )
)

;; Get royalty info for a token
(define-read-only (get-royalty-info (token-id uint))
  (ok (map-get? token-royalties { token-id: token-id }))
)

;; Get creator balance
(define-read-only (get-creator-balance (creator principal))
  (ok (default-to u0 (map-get? creator-balances creator)))
)
