import {LightningElement, api, wire, track} from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getEmployeeReview from '@salesforce/apex/LWCPerformanceEvaluationController.getEmployeeReview';
import getEmployeeReviewNonCacheable from '@salesforce/apex/LWCPerformanceEvaluationController.getEmployeeReviewNonCacheable';
import getEmployeeReviewCount from '@salesforce/apex/LWCPerformanceEvaluationController.getEmployeeReviewCount';
import updateSubmittedByEvaluator from '@salesforce/apex/LWCPerformanceEvaluationController.updateSubmittedByEvaluator';

let i = 0;

export default class EmployeePerformanceEvaluationsSubtab extends LightningElement {
    @api employeeid;
    @api projectInformation;
    @api reviewSelected;
    @api reviewAssignmnetSelected;
    @track error; 
    @track projectItem = [];
    @track comboBoxValue = '';
    @track lstManagerId = [];
    
    @track userName = '';
    @track allSelected = false;
    @track projectStatuses=[];
    @track paginationRange = [];
    @track totalRecords;
    @track isDialogVisible = false;

    valueFilter = 'Reviews about me';
    offsetNumber
    lastPaginationEvent;
    isReviewSelected = false;
    managerList = false;


    get optionsFilter() {
        return [
            { label: 'Reviews done', value: 'Reviews done' },
            { label: 'Reviews about me', value: 'Reviews about me' },
            { label: 'Reviews to do', value: 'Reviews to do' },
        ];
    }

    handleChangeFilter(event) {
        this.valueFilter = event.detail.value;
        
        getEmployeeReviewNonCacheable({ empId:this.employeeid , filterStatus : this.valueFilter}).then(data => {
            
        
            if(this.employeeid != '' ){
                getEmployeeReviewCount({empId: this.employeeid,filterStatus : this.valueFilter}).then(projectCount =>{ 
                    
                    if(projectCount){
                    this.projectStatuses = [];
                    this.totalRecords = projectCount;
                        let i = 1;
                        if (data) {
                            this.projectStatuses = data;
                            let preparedAssets = [];
                            let id = 0;
                            if (this.valueFilter == 'Reviews done' || this.valueFilter == 'Reviews to do'   ) {
                                this.projectStatuses.forEach(asset => {
                                    let preparedAsset = {};
                                    preparedAsset.Id = asset.Review__c;
                                    preparedAsset.ReviewAssignmnetId = asset.Id;
                                    preparedAsset.Status = asset.Review__r.Status__c;
                                    preparedAsset.StatusDate = asset.Review__r.CreatedDate;
                                    preparedAsset.StatusComments = asset.Review__r.Comments__c;
                                    preparedAsset.ManagerName = asset.Review__r.Evaluated__r.Name;
                                    preparedAssets.push(preparedAsset);
                                });
                                this.projectStatuses = preparedAssets;
                            }else{
                                const map = new Map();
                                this.projectStatuses.forEach(asset => {                 
                                    if(map.has(asset.Review__c)){
                                        let preparedAssetval= map.get(asset.Review__c);

                                        preparedAssetval.ManagerName = preparedAssetval.ManagerName +' - '+asset.Evaluator__r.Name;
                                        map.set(asset.Review__c, preparedAssetval);
                                    }
                                    else{
                                        let preparedAsset = {};
                                        preparedAsset.Id = asset.Review__c;
                                        preparedAsset.ReviewAssignmnetId = asset.Id;
                                        preparedAsset.Status = asset.Review__r.Status__c;
                                        preparedAsset.StatusDate = asset.Review__r.CreatedDate;
                                        preparedAsset.StatusComments = asset.Review__r.Comments__c;
                                        preparedAsset.ManagerName = asset.Evaluator__r.Name;
                                        map.set(asset.Review__c, preparedAsset);

                                    }                                    
                                });

                                this.projectStatuses = Array.from(map.values());
                            }
                        } else if (error) {
                            this.error = error;
                        }
                        //looking at displaying 4 recrods per page
                        const paginationNumbers = Math.ceil(this.totalRecords / 4);
                        //create an array with size equals to paginationNumbers
                        this.paginationRange = [];
                        while (
                            this.paginationRange.push(i++) < paginationNumbers
                            // eslint-disable-next-line no-empty
                        ) {}
                    }else{
                        this.projectStatuses = [];
                        this.paginationRange = [];
                    }
                });
            }
        })
        
            

    }

    handleWrapper(event){

        if (this.isReviewSelected){
            this.isReviewSelected = false;
        }
        else {
            
            let newSelection = event.currentTarget.dataset.id;
            this.reviewAssignmnetSelected = event.currentTarget.dataset.reviewassigid;
            this.reviewSelected = newSelection;
            this.isReviewSelected = true;                     
        }
    }

    handleSubmit(event){
        this.isDialogVisible = true;
    }

    handleClick(event){
        if(event.target.name === 'confirmModal'){
              if(event.detail.status === 'confirm') {
                    updateSubmittedByEvaluator({ reviewAssignmentId: this.reviewAssignmnetSelected })
                    .then(result => {
                        if (result) {
                            const toast = new ShowToastEvent({
                                title: 'Success',
                                variant: 'success',
                                message: 'Submitted successfully'
                            });
                            this.dispatchEvent(toast);
                            this.template.querySelector("c-performance-evaluation-wrapper").saveComments();
                        } else {
                            console.log('Error - Not Submitted');
                        }
                    })
                    .catch(error => {
                        console.log('error: ', error);
                    });
                }else if(event.detail.status === 'cancel'){
                }
            this.isDialogVisible = false;
        }
    }

    refreshList(){      
        if (this.offsetNumber && this.offsetNumber>1){            
            const eventFilter = new CustomEvent('refresh', { detail: { value: this.offsetNumber}});
            this.handlePaginationClick(eventFilter);    
        }
        else {
            const eventFilter = new CustomEvent('refresh', { detail: {value: this.valueFilter }});
            this.handleChangeFilter(eventFilter);           
        }        
    }
   
    get projectOptions() {
        return this.projectItem;
    }
   
    @wire(getEmployeeReview,{ empId: '$employeeid' ,filterStatus : 'Reviews about me'}) getEmployeeReview({error,data}){
        try{
            if(this.employeeid != '' ){
                getEmployeeReviewCount({empId: this.employeeid,filterStatus : 'Reviews about me'}).then(projectCount =>{ 
                    
                    if(projectCount){
                    this.projectStatuses = [];
                    this.totalRecords = projectCount;
                        let i = 1;
                        if (data) {
                            this.projectStatuses = data;
                            let preparedAssets = [];
                            let id = 0;
                            const map = new Map();
                            this.projectStatuses.forEach(asset => {
                                if(map.has(asset.Review__c)){
                                    let preparedAssetval= map.get(asset.Review__c);

                                    preparedAssetval.ManagerName = preparedAssetval.ManagerName +' - '+asset.Evaluator__r.Name;
                                    map.set(asset.Review__c, preparedAssetval);
                                }
                                else{
                                    let preparedAsset = {};
                                    preparedAsset.Id = asset.Review__c;
                                    preparedAsset.ReviewAssignmnetId = asset.Id;
                                    preparedAsset.Status = asset.Review__r.Status__c;
                                    preparedAsset.StatusDate = asset.Review__r.CreatedDate;
                                    preparedAsset.StatusComments = asset.Review__r.Comments__c;
                                    preparedAsset.ManagerName = asset.Evaluator__r.Name;
                                    map.set(asset.Review__c, preparedAsset);

                                }         
                            });
                            this.projectStatuses = Array.from(map.values());

                        } else if (error) {
                            this.error = error;
                        }
                        //looking at displaying 4 recrods per page
                        const paginationNumbers = Math.ceil(this.totalRecords / 4);
                        //create an array with size equals to paginationNumbers
                        this.paginationRange = [];
                        while (
                            this.paginationRange.push(i++) < paginationNumbers
                            // eslint-disable-next-line no-empty
                        ) {}
                    }else{
                        this.projectStatuses = [];
                        this.paginationRange = [];
                    }
                });
            }
        }catch(error){
            console.log(error);
        }
    }

    

    handlePaginationClick(event) {        
        if (event.detail.value){
            this.offsetNumber = event.detail.value;
        }
        else {
            this.offsetNumber = event.target.dataset.targetNumber;
        }
        //reduce 1 from the clciked number and multiply it with 4, 
        //since we are showing 4 records per page and pass the offset to apex class 
        getEmployeeReviewNonCacheable({empId: this.employeeid,filterStatus : this.valueFilter, offsetRange: 4 * (this.offsetNumber - 1) })
            .then(data => {
                if (data) {
                    this.projectStatuses = data;
                    let preparedAssets = [];
                    let id = 0;
                    // this.projectStatuses.forEach(asset => {
                    //     let preparedAsset = {};
                    //     preparedAsset.Id = id++;
                    //     preparedAsset.Status = asset.Status__c;
                    //     preparedAsset.StatusDate = asset.CreatedDate;
                    //     preparedAsset.StatusComments = asset.Comments__c;
                    //     preparedAsset.ManagerName = asset.CreatedBy.Name;
                    //     preparedAssets.push(preparedAsset);
                    // });
                    // this.projectStatuses = preparedAssets;

                    if (this.valueFilter == 'Reviews done' || this.valueFilter == 'Reviews to do'   ) {
                        this.projectStatuses.forEach(asset => {
                            let preparedAsset = {};
                            preparedAsset.Id = asset.Review__c;
                            preparedAsset.ReviewAssignmnetId = asset.Id;
                            preparedAsset.Status = asset.Review__r.Status__c;
                            preparedAsset.StatusDate = asset.Review__r.CreatedDate;
                            preparedAsset.StatusComments = asset.Review__r.Comments__c;
                            preparedAsset.ManagerName = asset.Review__r.Evaluated__r.Name;
                            preparedAssets.push(preparedAsset);
                        });
                        this.projectStatuses = preparedAssets;
                    }else{
                        const map = new Map();
                        this.projectStatuses.forEach(asset => {
                            if(map.has(asset.Review__c)){
                                let preparedAssetval= map.get(asset.Review__c);

                                preparedAssetval.ManagerName = preparedAssetval.ManagerName +' - '+asset.Evaluator__r.Name;
                                map.set(asset.Review__c, preparedAssetval);
                            }
                            else{
                                let preparedAsset = {};
                                preparedAsset.Id = asset.Review__c;
                                preparedAsset.Status = asset.Review__r.Status__c;
                                preparedAsset.StatusDate = asset.Review__r.CreatedDate;
                                preparedAsset.StatusComments = asset.Review__r.Comments__c;
                                preparedAsset.ManagerName = asset.Evaluator__r.Name;
                                map.set(asset.Review__c, preparedAsset);

                            }        
                        });
                        this.projectStatuses = map.values();
                    }
                } else if (error) {
                    this.error = error;
                }
            })
            .catch(error => {
                // eslint-disable-next-line no-console
                console.log(error);
            });
    } 
    // handlePaginationClick(event) {
    //     let offsetNumber = event.target.dataset.targetNumber;
    //     //reduce 1 from the clciked number and multiply it with 4, 
    //     //since we are showing 4 records per page and pass the offset to apex class 
    //     getEmployeeReviewCount({empId: this.employeeid, offsetRange: 4 * (offsetNumber - 1) })
    //         .then(data => {
    //             if (data) {
    //                 this.projectStatuses = data;
    //                 let preparedAssets = [];
    //                 let id = 0;
    //                 this.projectStatuses.forEach(asset => {
    //                     let preparedAsset = {};
    //                     preparedAsset.Id = id++;
    //                     preparedAsset.Status = asset.Status__c;
    //                     preparedAsset.StatusDate = asset.CreatedDate;
    //                     preparedAsset.StatusComments = asset.Comments__c;
    //                     preparedAsset.ManagerName = asset.CreatedBy.Name;
    //                     preparedAssets.push(preparedAsset);
    //                 });
    //                 this.projectStatuses = preparedAssets;
    //             } else if (error) {
    //                 this.error = error;
    //             }
    //         })
    //         .catch(error => {
    //             // eslint-disable-next-line no-console
    //             console.log(error);
    //         });
    // } 
}