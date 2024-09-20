;; Define constants
(define-constant err-profile-exists (err u100))
(define-constant err-profile-not-found (err u101))

;; Define data maps
(define-map user-profiles
  principal
  {
    username: (string-ascii 20),
    bio: (string-utf8 280),
    owned-nfts: (list 100 uint),
    created-nfts: (list 100 uint),
    sale-history: (list 100 { token-id: uint, price: uint }),
    purchase-history: (list 100 { token-id: uint, price: uint })
  }
)

;; Define public functions

;; Create a new user profile
(define-public (create-profile (username (string-ascii 20)) (bio (string-utf8 280)))
  (let
    (
      (new-profile {
        username: username,
        bio: bio,
        owned-nfts: (list ),
        created-nfts: (list ),
        sale-history: (list ),
        purchase-history: (list )
      })
    )
    (asserts! (is-none (map-get? user-profiles tx-sender)) err-profile-exists)
    (ok (map-set user-profiles tx-sender new-profile))
  )
)

;; Update user profile
(define-public (update-profile (username (string-ascii 20)) (bio (string-utf8 280)))
  (let
    (
      (existing-profile (unwrap! (map-get? user-profiles tx-sender) err-profile-not-found))
    )
    (ok (map-set user-profiles
                 tx-sender
                 (merge existing-profile { username: username, bio: bio })))
  )
)

;; Add owned NFT to profile
(define-public (add-owned-nft (token-id uint))
  (let
    (
      (existing-profile (unwrap! (map-get? user-profiles tx-sender) err-profile-not-found))
      (owned-nfts (get owned-nfts existing-profile))
    )
    (ok (map-set user-profiles
                 tx-sender
                 (merge existing-profile { owned-nfts: (unwrap! (as-max-len? (append owned-nfts token-id) u100) err-profile-not-found) })))
  )
)

;; Add created NFT to profile
(define-public (add-created-nft (token-id uint))
  (let
    (
      (existing-profile (unwrap! (map-get? user-profiles tx-sender) err-profile-not-found))
      (created-nfts (get created-nfts existing-profile))
    )
    (ok (map-set user-profiles
                 tx-sender
                 (merge existing-profile { created-nfts: (unwrap! (as-max-len? (append created-nfts token-id) u100) err-profile-not-found) })))
  )
)

;; Add sale to history
(define-public (add-sale (token-id uint) (price uint))
  (let
    (
      (existing-profile (unwrap! (map-get? user-profiles tx-sender) err-profile-not-found))
      (sale-history (get sale-history existing-profile))
    )
    (ok (map-set user-profiles
                 tx-sender
                 (merge existing-profile { sale-history: (unwrap! (as-max-len? (append sale-history { token-id: token-id, price: price }) u100) err-profile-not-found) })))
  )
)

;; Add purchase to history
(define-public (add-purchase (token-id uint) (price uint))
  (let
    (
      (existing-profile (unwrap! (map-get? user-profiles tx-sender) err-profile-not-found))
      (purchase-history (get purchase-history existing-profile))
    )
    (ok (map-set user-profiles
                 tx-sender
                 (merge existing-profile { purchase-history: (unwrap! (as-max-len? (append purchase-history { token-id: token-id, price: price }) u100) err-profile-not-found) })))
  )
)

;; Get user profile
(define-read-only (get-profile (user principal))
  (ok (map-get? user-profiles user))
)
