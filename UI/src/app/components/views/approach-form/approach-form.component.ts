import { Component, OnInit, ViewChild } from '@angular/core';
import { RefactoringApproach } from '../../../../../api/repository/models/refactoring-approach';
import { lastValueFrom, Subscription } from 'rxjs';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { RefactoringApproachService } from '../../../../../api/repository/services/refactoring-approach.service';
import { UtilService } from '../../../services/util.service';
import { NAV_PARAM_APPROACH_ID } from '../../../app.constants';
import { MatAccordion } from '@angular/material/expansion';
import { FormControl, Validators } from '@angular/forms';
import { CustomValidators } from '../../../utils/custom-validators';
import {
  ConfirmDialogComponent,
  ConfirmDialogData
} from '../../dialogs/confirm-dialog/confirm-dialog.component';
import { DomainArtifactInput } from '../../../../../api/repository/models/domain-artifact-input';
import { RuntimeArtifactInput } from '../../../../../api/repository/models/runtime-artifact-input';
import { ModelArtifactInput } from '../../../../../api/repository/models/model-artifact-input';
import { ExecutableInput } from '../../../../../api/repository/models/executable-input';
import { ConnectedDataListElement } from '../../generics/connected-data-lists/connected-data-lists.component';
import { Quality } from '../../../../../api/repository/models/quality';
import { Direction } from '../../../../../api/repository/models/direction';
import { AutomationLevel } from '../../../../../api/repository/models/automation-level';
import { AnalysisType } from '../../../../../api/repository/models/analysis-type';
import { Technique } from '../../../../../api/repository/models/technique';
import { Architecture } from '../../../../../api/repository/models/architecture';
import { ServiceType } from '../../../../../api/repository/models/service-type';
import { ApproachOutput } from '../../../../../api/repository/models/approach-output';
import {
  copy,
  findArrayDifference,
  findArrayDifferenceWithCustomEquals,
  removeElementFromArray
} from '../../../utils/utils';
import { ResultsQuality } from '../../../../../api/repository/models/results-quality';
import { ToolSupport } from '../../../../../api/repository/models/tool-support';
import { AccuracyPrecision } from '../../../../../api/repository/models/accuracy-precision';
import { ValidationMethod } from '../../../../../api/repository/models/validation-method';
import { ApiService } from '../../../services/api.service';
import { AttributeOptionsService } from '../../../services/attribute-options.service';

@Component({
  selector: 'app-approach-form',
  templateUrl: './approach-form.component.html',
  styleUrls: ['./approach-form.component.scss']
})
export class ApproachFormComponent implements OnInit {
  @ViewChild(MatAccordion)
  accordion!: MatAccordion;

  titleFormControl = new FormControl('', [Validators.required]);
  yearFormControl = new FormControl('', [
    Validators.required,
    Validators.min(1900),
    Validators.max(new Date().getFullYear())
  ]);
  linkFormControl = new FormControl('', [
    Validators.required,
    CustomValidators.url
  ]);
  authorsFormControl = new FormControl('', [Validators.required]);

  refactoringApproach: RefactoringApproach = {};

  titleInputValue: string = '';
  yearInputValue: string = '';
  authorsInputValue: string = '';
  linkInputValue: string = '';

  domainArtifactSourceDataList: ConnectedDataListElement[] = [];
  domainArtifactTargetDataList: ConnectedDataListElement[] = [];
  runtimeArtifactSourceDataList: ConnectedDataListElement[] = [];
  runtimeArtifactTargetDataList: ConnectedDataListElement[] = [];
  modelArtifactSourceDataList: ConnectedDataListElement[] = [];
  modelArtifactTargetDataList: ConnectedDataListElement[] = [];
  executableSourceDataList: ConnectedDataListElement[] = [];
  executableTargetDataList: ConnectedDataListElement[] = [];
  qualitySourceDataList: ConnectedDataListElement[] = [];
  qualityTargetDataList: ConnectedDataListElement[] = [];
  directionSourceDataList: ConnectedDataListElement[] = [];
  directionTargetDataList: ConnectedDataListElement[] = [];
  automationLevelSourceDataList: ConnectedDataListElement[] = [];
  automationLevelTargetDataList: ConnectedDataListElement[] = [];
  analysisTypeSourceDataList: ConnectedDataListElement[] = [];
  analysisTypeTargetDataList: ConnectedDataListElement[] = [];
  techniqueSourceDataList: ConnectedDataListElement[] = [];
  techniqueTargetDataList: ConnectedDataListElement[] = [];

  selectedOutputArchitecture!: Architecture;
  selectedOutputServiceType!: ServiceType;
  currentOutputList: ApproachOutput[] = [];

  selectedResultsQuality!: ResultsQuality;
  selectedToolSupport!: ToolSupport;
  selectedAccuracyPrecision!: AccuracyPrecision;
  selectedValidationMethod!: ValidationMethod;

  isCreateView: boolean = true;
  isDataLoading: boolean = true;

  private routeSub!: Subscription;

  constructor(
    private refactoringApproachService: RefactoringApproachService,
    private apiService: ApiService,
    public attributeOptionsService: AttributeOptionsService,
    private utilService: UtilService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe({
      next: (paramMap: ParamMap) => {
        this.isCreateView = !paramMap.has(NAV_PARAM_APPROACH_ID);
        this.isDataLoading = true;
        if (this.isCreateView) {
          this.attributeOptionsService
            .requestAttributeOptions(this.utilService)
            .then(() => {
              this.fillDataLists();
              this.setRadioDefaults();
              this.isDataLoading = false;
            });
        } else {
          let approachId = parseInt(
            paramMap.get(NAV_PARAM_APPROACH_ID) as string
          );

          this.requestRefactoringApproach(approachId)
            .then(() => {
              this.attributeOptionsService
                .requestAttributeOptions(this.utilService)
                .then(() => {
                  this.fillDataLists();
                  this.fillInOutputs();
                  this.fillInUsabilityAttributes();
                  this.isDataLoading = false;
                });
            })
            .catch(() => {
              this.router.navigate(['/not-found']);
            });
        }
      }
    });
  }

  requestRefactoringApproach(approachId: number): Promise<void> {
    return this.apiService
      .getRefactoringApproach(approachId)
      .then((value: RefactoringApproach) => {
        this.refactoringApproach = value;
      })
      .catch(() => {
        this.utilService.callSnackBar(
          'Error! Refactoring approach could not be retrieved.'
        );
      });
  }

  fillDataLists(): void {
    this.fillDomainArtifactDataLists();
    this.fillRuntimeArtifactDataLists();
    this.fillModelArtifactDataLists();
    this.fillExecutableDataLists();

    this.fillQualityDataLists();
    this.fillDirectionDataLists();
    this.fillAutomationLevelDataLists();
    this.fillAnalysisTypeDataLists();
    this.fillTechniqueDataLists();
  }

  fillInOutputs() {
    if (this.refactoringApproach.approachOutputs == null) {
      this.currentOutputList = [];
    } else {
      this.currentOutputList = copy(this.refactoringApproach.approachOutputs);
    }
  }

  setRadioDefaults(): void {
    this.setSelectedResultsQualityToDefault();
    this.setSelectedToolSupportToDefault();
    this.setSelectedAccuracyPrecisionToDefault();
    this.setSelectedValidationMethodToDefault();
  }

  fillInUsabilityAttributes() {
    if (this.refactoringApproach.approachUsability?.resultsQuality != null) {
      // @ts-ignore
      this.selectedResultsQuality =
        this.attributeOptionsService.resultsQualities.find(
          (value: ResultsQuality) =>
            value.name ===
            // @ts-ignore
            this.refactoringApproach.approachUsability.resultsQuality.name
        );
    }
    if (this.refactoringApproach.approachUsability?.toolSupport != null) {
      // @ts-ignore
      this.selectedToolSupport = this.attributeOptionsService.toolSupports.find(
        (value: ToolSupport) =>
          value.name ===
          // @ts-ignore
          this.refactoringApproach.approachUsability.toolSupport.name
      );
    }
    if (this.refactoringApproach.approachUsability?.accuracyPrecision != null) {
      // @ts-ignore
      this.selectedAccuracyPrecision =
        this.attributeOptionsService.accuracyPrecisions.find(
          (value: AccuracyPrecision) =>
            value.name ===
            // @ts-ignore
            this.refactoringApproach.approachUsability.accuracyPrecision.name
        );
    }
    if (this.refactoringApproach.approachUsability?.validationMethod != null) {
      // @ts-ignore
      this.selectedValidationMethod =
        this.attributeOptionsService.validationMethods.find(
          (value: ValidationMethod) =>
            value.name ===
            // @ts-ignore
            this.refactoringApproach.approachUsability.validationMethod.name
        );
    }
  }

  fillDomainArtifactDataLists(): void {
    this.domainArtifactSourceDataList = [];
    this.domainArtifactTargetDataList = [];

    this.utilService.fillConnectedDataLists(
      this.isCreateView,
      this.refactoringApproach.domainArtifactInputs,
      this.attributeOptionsService.domainArtifacts,
      this.domainArtifactSourceDataList,
      this.domainArtifactTargetDataList,
      (e: DomainArtifactInput) => e.name
    );
  }

  fillRuntimeArtifactDataLists(): void {
    this.runtimeArtifactSourceDataList = [];
    this.runtimeArtifactTargetDataList = [];

    this.utilService.fillConnectedDataLists(
      this.isCreateView,
      this.refactoringApproach.runtimeArtifactInputs,
      this.attributeOptionsService.runtimeArtifacts,
      this.runtimeArtifactSourceDataList,
      this.runtimeArtifactTargetDataList,
      (e: RuntimeArtifactInput) => e.name
    );
  }

  fillModelArtifactDataLists(): void {
    this.modelArtifactSourceDataList = [];
    this.modelArtifactTargetDataList = [];

    this.utilService.fillConnectedDataLists(
      this.isCreateView,
      this.refactoringApproach.modelArtifactInputs,
      this.attributeOptionsService.modelArtifacts,
      this.modelArtifactSourceDataList,
      this.modelArtifactTargetDataList,
      (e: ModelArtifactInput) => e.name
    );
  }

  fillExecutableDataLists(): void {
    this.executableSourceDataList = [];
    this.executableTargetDataList = [];

    this.utilService.fillConnectedDataLists(
      this.isCreateView,
      this.refactoringApproach.executableInputs,
      this.attributeOptionsService.executables,
      this.executableSourceDataList,
      this.executableTargetDataList,
      (e: ExecutableInput) => `${e.name}: ${e.language}`
    );
  }

  fillQualityDataLists(): void {
    this.qualitySourceDataList = [];
    this.qualityTargetDataList = [];

    this.utilService.fillConnectedDataLists(
      this.isCreateView,
      this.refactoringApproach.approachProcess?.qualities,
      this.attributeOptionsService.qualities,
      this.qualitySourceDataList,
      this.qualityTargetDataList,
      (e: Quality) => `${e.category}: ${e.name}`
    );
  }

  fillDirectionDataLists(): void {
    this.directionSourceDataList = [];
    this.directionTargetDataList = [];

    this.utilService.fillConnectedDataLists(
      this.isCreateView,
      this.refactoringApproach.approachProcess?.directions,
      this.attributeOptionsService.directions,
      this.directionSourceDataList,
      this.directionTargetDataList,
      (e: Direction) => e.name
    );
  }

  fillAutomationLevelDataLists(): void {
    this.automationLevelSourceDataList = [];
    this.automationLevelTargetDataList = [];

    this.utilService.fillConnectedDataLists(
      this.isCreateView,
      this.refactoringApproach.approachProcess?.automationLevels,
      this.attributeOptionsService.automationLevels,
      this.automationLevelSourceDataList,
      this.automationLevelTargetDataList,
      (e: AutomationLevel) => e.name
    );
  }

  fillAnalysisTypeDataLists(): void {
    this.analysisTypeSourceDataList = [];
    this.analysisTypeTargetDataList = [];

    this.utilService.fillConnectedDataLists(
      this.isCreateView,
      this.refactoringApproach.approachProcess?.analysisTypes,
      this.attributeOptionsService.analysisTypes,
      this.analysisTypeSourceDataList,
      this.analysisTypeTargetDataList,
      (e: AnalysisType) => e.name
    );
  }

  fillTechniqueDataLists(): void {
    this.techniqueSourceDataList = [];
    this.techniqueTargetDataList = [];

    this.utilService.fillConnectedDataLists(
      this.isCreateView,
      this.refactoringApproach.approachProcess?.techniques,
      this.attributeOptionsService.techniques,
      this.techniqueSourceDataList,
      this.techniqueTargetDataList,
      (e: Technique) => e.name
    );
  }

  setSelectedResultsQualityToDefault(): void {
    let defaultValue = this.attributeOptionsService.resultsQualities.find(
      (value: ResultsQuality) => value.name === 'Not available'
    );
    if (defaultValue !== undefined) {
      this.selectedResultsQuality = defaultValue;
    } else {
      this.selectedResultsQuality =
        this.attributeOptionsService.resultsQualities[0];
    }
  }

  setSelectedToolSupportToDefault(): void {
    let defaultValue = this.attributeOptionsService.toolSupports.find(
      (value: ToolSupport) => value.name === 'No tool support'
    );
    if (defaultValue !== undefined) {
      this.selectedToolSupport = defaultValue;
    } else {
      this.selectedToolSupport = this.attributeOptionsService.toolSupports[0];
    }
  }

  setSelectedAccuracyPrecisionToDefault(): void {
    let defaultValue = this.attributeOptionsService.accuracyPrecisions.find(
      (value: AccuracyPrecision) => value.name === 'Not available'
    );
    if (defaultValue !== undefined) {
      this.selectedAccuracyPrecision = defaultValue;
    } else {
      this.selectedAccuracyPrecision =
        this.attributeOptionsService.accuracyPrecisions[0];
    }
  }

  setSelectedValidationMethodToDefault(): void {
    let defaultValue = this.attributeOptionsService.validationMethods.find(
      (value: ValidationMethod) => value.name === 'No validation'
    );
    if (defaultValue !== undefined) {
      this.selectedValidationMethod = defaultValue;
    } else {
      this.selectedValidationMethod =
        this.attributeOptionsService.validationMethods[0];
    }
  }

  addOutput(): void {
    if (
      this.selectedOutputArchitecture === undefined ||
      this.selectedOutputServiceType === undefined
    ) {
      this.utilService.callSnackBar(
        'Error! Output must have an architecture and service type selected.'
      );
      return;
    }

    if (
      this.currentOutputList.find(
        (output) =>
          output.architecture?.name === this.selectedOutputArchitecture.name &&
          output.serviceType?.name === this.selectedOutputServiceType.name
      ) !== undefined
    ) {
      this.utilService.callSnackBar('Output already exists.');
      return;
    }

    // TODO maybe dialog
    this.currentOutputList.push({
      architecture: this.selectedOutputArchitecture,
      serviceType: this.selectedOutputServiceType
    });
  }

  removeOutput(output: ApproachOutput): void {
    let data: ConfirmDialogData = {
      title: 'Remove the selected output?',
      message: `Do you want to remove the output with architecture \"${output.architecture?.name}\" and service type \"${output.serviceType?.name}\"?`,
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel'
    };
    this.utilService
      .createDialog(ConfirmDialogComponent, data)
      .afterClosed()
      .subscribe({
        next: (data) => {
          if (data == null) return;

          removeElementFromArray(
            this.currentOutputList,
            output,
            (a, b) =>
              a.architecture?.name === b.architecture?.name &&
              a.serviceType?.name === b.serviceType?.name
          );
        }
      });
  }

  createRefactoringApproach(): void {
    let data: ConfirmDialogData = {
      title: 'Create a new refactoring approach?',
      message:
        'Do you want to create a new refactoring approach based on the given data?',
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel'
    };

    this.utilService
      .createDialog(ConfirmDialogComponent, data)
      .afterClosed()
      .subscribe({
        next: (data: ConfirmDialogData) => {
          if (data === undefined) return;

          let refactoringApproach =
            this.createRefactoringApproachFromFilledInData();

          this.apiService
            .addRefactoringApproach(refactoringApproach)
            .then((value: RefactoringApproach) => {
              this.refactoringApproach = value;
              this.isCreateView = false;
              this.router.navigate([value.refactoringApproachId], {
                relativeTo: this.route
              });
            })
            .catch(() => {
              this.utilService.callSnackBar(
                'Refactoring approach could not be created.'
              );
            });
        }
      });
  }

  updateRefactoringApproach(): void {
    let data: ConfirmDialogData = {
      title: 'Update the current refactoring approach?',
      message:
        'Do you want to update the current refactoring approach based on the current changes?',
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel'
    };

    this.utilService
      .createDialog(ConfirmDialogComponent, data)
      .afterClosed()
      .subscribe({
        next: (data: ConfirmDialogData) => {
          if (data === undefined) return;

          this.processRefactoringApproachUpdate();
        }
      });
  }

  processRefactoringApproachUpdate(): void {
    if (this.refactoringApproach.refactoringApproachId == null) return;

    let refactoringApproach = this.createRefactoringApproachFromFilledInData();
    let updatePromises: Promise<void>[] = [];

    updatePromises.push(...this.updateDomainArtifacts(refactoringApproach));
    updatePromises.push(...this.updateRuntimeArtifacts(refactoringApproach));
    updatePromises.push(...this.updateModelArtifacts(refactoringApproach));
    updatePromises.push(...this.updateExecutables(refactoringApproach));

    updatePromises.push(...this.updateQualities(refactoringApproach));
    updatePromises.push(...this.updateDirections(refactoringApproach));
    updatePromises.push(...this.updateAutomationLevels(refactoringApproach));
    updatePromises.push(...this.updateAnalysisTypes(refactoringApproach));
    updatePromises.push(...this.updateTechniques(refactoringApproach));

    updatePromises.push(...this.updateOutputs(refactoringApproach));

    updatePromises.push(
      lastValueFrom(
        this.refactoringApproachService.updateResultsQuality({
          id: this.refactoringApproach.refactoringApproachId,
          body: this.selectedResultsQuality
        })
      )
    );
    updatePromises.push(
      lastValueFrom(
        this.refactoringApproachService.updateToolSupport({
          id: this.refactoringApproach.refactoringApproachId,
          body: this.selectedToolSupport
        })
      )
    );
    updatePromises.push(
      lastValueFrom(
        this.refactoringApproachService.updateAccuracyPrecision({
          id: this.refactoringApproach.refactoringApproachId,
          body: this.selectedAccuracyPrecision
        })
      )
    );
    updatePromises.push(
      lastValueFrom(
        this.refactoringApproachService.updateValidationMethod({
          id: this.refactoringApproach.refactoringApproachId,
          body: this.selectedValidationMethod
        })
      )
    );

    Promise.all(updatePromises)
      .then(() => {
        this.utilService.callSnackBar('Changes have been saved successfully.');
      })
      .catch(() => {
        this.utilService.callSnackBar(
          'Error while saving refactoring approach changes! Some changed might not be able to be saved.'
        );
      });
  }

  updateDomainArtifacts(
    refactoringApproach: RefactoringApproach
  ): Promise<void>[] {
    let elementsToRemove: DomainArtifactInput[] = findArrayDifference(
      this.refactoringApproach.domainArtifactInputs,
      refactoringApproach.domainArtifactInputs
    );
    let elementsToAdd: DomainArtifactInput[] = findArrayDifference(
      refactoringApproach.domainArtifactInputs,
      this.refactoringApproach.domainArtifactInputs
    );

    let updatePromises: Promise<void>[] = [];
    for (const elementToAdd of elementsToAdd) {
      updatePromises.push(
        lastValueFrom(
          this.refactoringApproachService.addDomainArtifactAsInput({
            // @ts-ignore
            id: this.refactoringApproach.refactoringApproachId,
            body: elementToAdd
          })
        )
      );
    }
    for (const elementToRemove of elementsToRemove) {
      if (elementToRemove.name == null) break;

      updatePromises.push(
        lastValueFrom(
          this.refactoringApproachService.removeDomainArtifactFromInputs({
            // @ts-ignore
            id: this.refactoringApproach.refactoringApproachId,
            inputName: elementToRemove.name
          })
        )
      );
    }

    return updatePromises;
  }

  updateRuntimeArtifacts(
    refactoringApproach: RefactoringApproach
  ): Promise<void>[] {
    let elementsToRemove: RuntimeArtifactInput[] = findArrayDifference(
      this.refactoringApproach.runtimeArtifactInputs,
      refactoringApproach.runtimeArtifactInputs
    );
    let elementsToAdd: RuntimeArtifactInput[] = findArrayDifference(
      refactoringApproach.runtimeArtifactInputs,
      this.refactoringApproach.runtimeArtifactInputs
    );

    let updatePromises: Promise<void>[] = [];
    for (const elementToAdd of elementsToAdd) {
      updatePromises.push(
        lastValueFrom(
          this.refactoringApproachService.addRuntimeArtifactAsInput({
            // @ts-ignore
            id: this.refactoringApproach.refactoringApproachId,
            body: elementToAdd
          })
        )
      );
    }
    for (const elementToRemove of elementsToRemove) {
      if (elementToRemove.name == null) break;

      updatePromises.push(
        lastValueFrom(
          this.refactoringApproachService.removeRuntimeArtifactFromInputs({
            // @ts-ignore
            id: this.refactoringApproach.refactoringApproachId,
            inputName: elementToRemove.name
          })
        )
      );
    }

    return updatePromises;
  }

  updateModelArtifacts(
    refactoringApproach: RefactoringApproach
  ): Promise<void>[] {
    let elementsToRemove: ModelArtifactInput[] = findArrayDifference(
      this.refactoringApproach.modelArtifactInputs,
      refactoringApproach.modelArtifactInputs
    );
    let elementsToAdd: ModelArtifactInput[] = findArrayDifference(
      refactoringApproach.modelArtifactInputs,
      this.refactoringApproach.modelArtifactInputs
    );

    let updatePromises: Promise<void>[] = [];
    for (const elementToAdd of elementsToAdd) {
      updatePromises.push(
        lastValueFrom(
          this.refactoringApproachService.addModelArtifactAsInput({
            // @ts-ignore
            id: this.refactoringApproach.refactoringApproachId,
            body: elementToAdd
          })
        )
      );
    }
    for (const elementToRemove of elementsToRemove) {
      if (elementToRemove.name == null) break;

      updatePromises.push(
        lastValueFrom(
          this.refactoringApproachService.removeModelArtifactFromInputs({
            // @ts-ignore
            id: this.refactoringApproach.refactoringApproachId,
            inputName: elementToRemove.name
          })
        )
      );
    }

    return updatePromises;
  }

  updateExecutables(refactoringApproach: RefactoringApproach): Promise<void>[] {
    let elementsToRemove: ExecutableInput[] = findArrayDifference(
      this.refactoringApproach.executableInputs,
      refactoringApproach.executableInputs
    );
    let elementsToAdd: ExecutableInput[] = findArrayDifference(
      refactoringApproach.executableInputs,
      this.refactoringApproach.executableInputs
    );

    let updatePromises: Promise<void>[] = [];
    for (const elementToAdd of elementsToAdd) {
      updatePromises.push(
        lastValueFrom(
          this.refactoringApproachService.addExecutableAsInput({
            // @ts-ignore
            id: this.refactoringApproach.refactoringApproachId,
            body: elementToAdd
          })
        )
      );
    }
    for (const elementToRemove of elementsToRemove) {
      if (elementToRemove.name == null || elementToRemove.language == null)
        break;

      updatePromises.push(
        lastValueFrom(
          this.refactoringApproachService.removeExecutableFromInputs({
            // @ts-ignore
            id: this.refactoringApproach.refactoringApproachId,
            inputName: elementToRemove.name,
            language: elementToRemove.language
          })
        )
      );
    }

    return updatePromises;
  }

  updateQualities(refactoringApproach: RefactoringApproach): Promise<void>[] {
    let elementsToRemove: Quality[] = findArrayDifference(
      this.refactoringApproach.approachProcess?.qualities,
      refactoringApproach.approachProcess?.qualities
    );
    let elementsToAdd: Quality[] = findArrayDifference(
      refactoringApproach.approachProcess?.qualities,
      this.refactoringApproach.approachProcess?.qualities
    );

    let updatePromises: Promise<void>[] = [];
    for (const elementToAdd of elementsToAdd) {
      updatePromises.push(
        lastValueFrom(
          this.refactoringApproachService.addQualityToProcess({
            // @ts-ignore
            id: this.refactoringApproach.refactoringApproachId,
            body: elementToAdd
          })
        )
      );
    }
    for (const elementToRemove of elementsToRemove) {
      if (elementToRemove.name == null) break;

      updatePromises.push(
        lastValueFrom(
          this.refactoringApproachService.removeQualityFromProcess({
            // @ts-ignore
            id: this.refactoringApproach.refactoringApproachId,
            qualityName: elementToRemove.name
          })
        )
      );
    }

    return updatePromises;
  }

  updateDirections(refactoringApproach: RefactoringApproach): Promise<void>[] {
    let elementsToRemove: Direction[] = findArrayDifference(
      this.refactoringApproach.approachProcess?.directions,
      refactoringApproach.approachProcess?.directions
    );
    let elementsToAdd: Direction[] = findArrayDifference(
      refactoringApproach.approachProcess?.directions,
      this.refactoringApproach.approachProcess?.directions
    );

    let updatePromises: Promise<void>[] = [];
    for (const elementToAdd of elementsToAdd) {
      updatePromises.push(
        lastValueFrom(
          this.refactoringApproachService.addDirectionToProcess({
            // @ts-ignore
            id: this.refactoringApproach.refactoringApproachId,
            body: elementToAdd
          })
        )
      );
    }
    for (const elementToRemove of elementsToRemove) {
      if (elementToRemove.name == null) break;

      updatePromises.push(
        lastValueFrom(
          this.refactoringApproachService.removeDirectionFromProcess({
            // @ts-ignore
            id: this.refactoringApproach.refactoringApproachId,
            directionName: elementToRemove.name
          })
        )
      );
    }

    return updatePromises;
  }

  updateAutomationLevels(
    refactoringApproach: RefactoringApproach
  ): Promise<void>[] {
    let elementsToRemove: AutomationLevel[] = findArrayDifference(
      this.refactoringApproach.approachProcess?.automationLevels,
      refactoringApproach.approachProcess?.automationLevels
    );
    let elementsToAdd: AutomationLevel[] = findArrayDifference(
      refactoringApproach.approachProcess?.automationLevels,
      this.refactoringApproach.approachProcess?.automationLevels
    );

    let updatePromises: Promise<void>[] = [];
    for (const elementToAdd of elementsToAdd) {
      updatePromises.push(
        lastValueFrom(
          this.refactoringApproachService.addAutomationLevelToProcess({
            // @ts-ignore
            id: this.refactoringApproach.refactoringApproachId,
            body: elementToAdd
          })
        )
      );
    }
    for (const elementToRemove of elementsToRemove) {
      if (elementToRemove.name == null) break;

      updatePromises.push(
        lastValueFrom(
          this.refactoringApproachService.removeAutomationLevelFromProcess({
            // @ts-ignore
            id: this.refactoringApproach.refactoringApproachId,
            automationLevelName: elementToRemove.name
          })
        )
      );
    }

    return updatePromises;
  }

  updateAnalysisTypes(
    refactoringApproach: RefactoringApproach
  ): Promise<void>[] {
    let elementsToRemove: AnalysisType[] = findArrayDifference(
      this.refactoringApproach.approachProcess?.analysisTypes,
      refactoringApproach.approachProcess?.analysisTypes
    );
    let elementsToAdd: AnalysisType[] = findArrayDifference(
      refactoringApproach.approachProcess?.analysisTypes,
      this.refactoringApproach.approachProcess?.analysisTypes
    );

    let updatePromises: Promise<void>[] = [];
    for (const elementToAdd of elementsToAdd) {
      updatePromises.push(
        lastValueFrom(
          this.refactoringApproachService.addAnalysisTypeToProcess({
            // @ts-ignore
            id: this.refactoringApproach.refactoringApproachId,
            body: elementToAdd
          })
        )
      );
    }
    for (const elementToRemove of elementsToRemove) {
      if (elementToRemove.name == null) break;

      updatePromises.push(
        lastValueFrom(
          this.refactoringApproachService.removeAnalysisTypeFromProcess({
            // @ts-ignore
            id: this.refactoringApproach.refactoringApproachId,
            analysisTypeName: elementToRemove.name
          })
        )
      );
    }

    return updatePromises;
  }

  updateTechniques(refactoringApproach: RefactoringApproach): Promise<void>[] {
    let elementsToRemove: Technique[] = findArrayDifference(
      this.refactoringApproach.approachProcess?.techniques,
      refactoringApproach.approachProcess?.techniques
    );
    let elementsToAdd: Technique[] = findArrayDifference(
      refactoringApproach.approachProcess?.techniques,
      this.refactoringApproach.approachProcess?.techniques
    );

    let updatePromises: Promise<void>[] = [];
    for (const elementToAdd of elementsToAdd) {
      updatePromises.push(
        lastValueFrom(
          this.refactoringApproachService.addTechniqueToProcess({
            // @ts-ignore
            id: this.refactoringApproach.refactoringApproachId,
            body: elementToAdd
          })
        )
      );
    }
    for (const elementToRemove of elementsToRemove) {
      if (elementToRemove.name == null) break;

      updatePromises.push(
        lastValueFrom(
          this.refactoringApproachService.removeTechniqueFromProcess({
            // @ts-ignore
            id: this.refactoringApproach.refactoringApproachId,
            techniqueName: elementToRemove.name
          })
        )
      );
    }

    return updatePromises;
  }

  updateOutputs(refactoringApproach: RefactoringApproach) {
    let elementsToRemove: ApproachOutput[] =
      findArrayDifferenceWithCustomEquals(
        this.refactoringApproach.approachOutputs,
        refactoringApproach.approachOutputs,
        (a: ApproachOutput, b: ApproachOutput) =>
          a.architecture?.name === b.architecture?.name &&
          a.serviceType?.name === b.serviceType?.name
      );
    let elementsToAdd: ApproachOutput[] = findArrayDifferenceWithCustomEquals(
      refactoringApproach.approachOutputs,
      this.refactoringApproach.approachOutputs,
      (a: ApproachOutput, b: ApproachOutput) =>
        a.architecture?.name === b.architecture?.name &&
        a.serviceType?.name === b.serviceType?.name
    );

    let updatePromises: Promise<void>[] = [];
    for (const elementToAdd of elementsToAdd) {
      updatePromises.push(
        lastValueFrom(
          this.refactoringApproachService.addOutput({
            // @ts-ignore
            id: this.refactoringApproach.refactoringApproachId,
            body: elementToAdd
          })
        )
      );
    }
    for (const elementToRemove of elementsToRemove) {
      if (elementToRemove.approachOutputId == null) break;

      updatePromises.push(
        lastValueFrom(
          this.refactoringApproachService.removeOutput({
            // @ts-ignore
            id: this.refactoringApproach.refactoringApproachId,
            outputId: elementToRemove.approachOutputId
          })
        )
      );
    }

    return updatePromises;
  }

  createRefactoringApproachFromFilledInData(): RefactoringApproach {
    let domainArtifactInputs: DomainArtifactInput[] = [];
    for (const element of this.domainArtifactTargetDataList) {
      domainArtifactInputs.push(element.dataElement as DomainArtifactInput);
    }

    let runtimeArtifactInputs: RuntimeArtifactInput[] = [];
    for (const element of this.runtimeArtifactTargetDataList) {
      runtimeArtifactInputs.push(element.dataElement as RuntimeArtifactInput);
    }

    let modelArtifactInputs: ModelArtifactInput[] = [];
    for (const element of this.modelArtifactTargetDataList) {
      modelArtifactInputs.push(element.dataElement as ModelArtifactInput);
    }

    let executableInputs: ExecutableInput[] = [];
    for (const element of this.executableTargetDataList) {
      executableInputs.push(element.dataElement as ExecutableInput);
    }

    let qualities: Quality[] = [];
    for (const element of this.qualityTargetDataList) {
      qualities.push(element.dataElement as Quality);
    }

    let directions: Direction[] = [];
    for (const element of this.directionTargetDataList) {
      directions.push(element.dataElement as Direction);
    }

    let automationLevels: AutomationLevel[] = [];
    for (const element of this.automationLevelTargetDataList) {
      automationLevels.push(element.dataElement as AutomationLevel);
    }

    let analysisTypes: AnalysisType[] = [];
    for (const element of this.analysisTypeTargetDataList) {
      analysisTypes.push(element.dataElement as AnalysisType);
    }

    let techniques: Technique[] = [];
    for (const element of this.techniqueTargetDataList) {
      techniques.push(element.dataElement as Technique);
    }

    return {
      approachSource: {
        title: this.titleInputValue,
        year: parseInt(this.yearInputValue),
        link: this.linkInputValue,
        authors: this.authorsInputValue
      },
      domainArtifactInputs: domainArtifactInputs,
      runtimeArtifactInputs: runtimeArtifactInputs,
      modelArtifactInputs: modelArtifactInputs,
      executableInputs: executableInputs,
      approachProcess: {
        qualities: qualities,
        directions: directions,
        automationLevels: automationLevels,
        analysisTypes: analysisTypes,
        techniques: techniques
      },
      approachOutputs: this.currentOutputList,
      approachUsability: {
        resultsQuality: this.selectedResultsQuality,
        toolSupport: this.selectedToolSupport,
        accuracyPrecision: this.selectedAccuracyPrecision,
        validationMethod: this.selectedValidationMethod
      }
    };
  }

  cancel(): void {
    let data: ConfirmDialogData;
    if (this.isCreateView) {
      data = {
        title: 'Stop adding new refactoring approach?',
        message:
          'Do you want to stop adding a refactoring approach? All filled in data will be lost.',
        confirmButtonText: 'Yes',
        cancelButtonText: 'Cancel'
      };
    } else {
      data = {
        title: 'Stop updating refactoring approach?',
        message:
          'Do you want to stop updating the refactoring approach? All unsaved changed will be lost.',
        confirmButtonText: 'Yes',
        cancelButtonText: 'Cancel'
      };
    }

    this.utilService
      .createDialog(ConfirmDialogComponent, data)
      .afterClosed()
      .subscribe({
        next: (data: ConfirmDialogData) => {
          if (data === undefined) return;

          this.router.navigate(['/home']);
        }
      });
  }

  isCreateButtonActive(): boolean {
    return (
      this.titleFormControl.valid &&
      this.yearFormControl.valid &&
      this.linkFormControl.valid &&
      this.authorsFormControl.valid
    );
  }

  onChangeTitle(event: Event) {
    this.titleInputValue = (event.target as HTMLInputElement).value;
  }

  onChangeYear(event: Event) {
    this.yearInputValue = (event.target as HTMLInputElement).value;
  }

  onChangeLink(event: Event) {
    this.linkInputValue = (event.target as HTMLInputElement).value;
  }

  onChangeAuthors(event: Event) {
    this.authorsInputValue = (event.target as HTMLInputElement).value;
  }
}
