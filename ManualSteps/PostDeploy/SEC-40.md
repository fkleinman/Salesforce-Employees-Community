Step 1 - You need to delete the metadata Tech_Architect from your org.
Step 2 - In the console, go to your project's manifest folder and execute the next command:
    sfdx force:mdapi:deploy -d destructivePackage/ -u (your alias org)
