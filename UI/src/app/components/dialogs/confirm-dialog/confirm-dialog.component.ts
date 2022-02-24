import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {DialogData} from "../../../utils/models/dialog-data";

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css']
})
export class ConfirmDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<ConfirmDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData,
              public dialog: MatDialog) { }

  ngOnInit(): void {
  }

  onCancelClicked() {
    this.dialogRef.close();
  }
}

export interface ConfirmDialogData extends DialogData{
  message: string;
  confirmButtonText: string;
  cancelButtonText: string;
}
