import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function DeleteConfirmationModal({
  open,
  onCancel,
  onConfirm,
  productName,
}: {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  productName: string
}) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          Delete API Product
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <strong>{productName}</strong>?
          <br />
          This will permanently delete all specs, versions, polling data, and alerts.
        </p>

        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
