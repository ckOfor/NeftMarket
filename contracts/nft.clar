;; Define constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))
(define-constant err-token-not-found (err u102))

;; Define data variables
(define-data-var last-token-id uint u0)

;; Define data maps
(define-map tokens
  { token-id: uint }
  { owner: principal, metadata: (string-ascii 256) }
)

;; Define public functions

;; Mint a new token
(define-public (mint-token (metadata (string-ascii 256)))
  (let
    (
      (token-id (+ (var-get last-token-id) u1))
    )
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (map-set tokens { token-id: token-id } { owner: tx-sender, metadata: metadata })
    (var-set last-token-id token-id)
    (ok token-id)
  )
)

;; Transfer token to a new owner
(define-public (transfer-token (token-id uint) (recipient principal))
  (let
    (
      (token-data (unwrap! (map-get? tokens { token-id: token-id }) err-token-not-found))
      (token-owner (get owner token-data))
      (token-metadata (get metadata token-data))
    )
    (asserts! (is-eq tx-sender token-owner) err-not-token-owner)
    (ok (map-set tokens { token-id: token-id }
                 { owner: recipient,
                   metadata: token-metadata }))
  )
)

;; Get the owner of a token
(define-read-only (get-owner (token-id uint))
  (ok (get owner (map-get? tokens { token-id: token-id })))
)

;; Burn a token
(define-public (burn-token (token-id uint))
  (let
    (
      (token-owner (unwrap! (get owner (map-get? tokens { token-id: token-id })) err-token-not-found))
    )
    (asserts! (is-eq tx-sender token-owner) err-not-token-owner)
    (ok (map-delete tokens { token-id: token-id }))
  )
)

;; Get token metadata
(define-read-only (get-token-metadata (token-id uint))
  (ok (get metadata (map-get? tokens { token-id: token-id })))
)

;; Get the last token ID
(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)
