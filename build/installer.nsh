!macro customInstall
  Delete "$DESKTOP\Cetele.lnk"
  Delete "$SMPROGRAMS\Cetele.lnk"
  CreateShortCut "$DESKTOP\Cetele.lnk" "$INSTDIR\cetele.exe" "" "$INSTDIR\resources\assets\icon.ico" 0
  CreateShortCut "$SMPROGRAMS\Cetele.lnk" "$INSTDIR\cetele.exe" "" "$INSTDIR\resources\assets\icon.ico" 0
!macroend

!macro customUnInstall
  Delete "$DESKTOP\Cetele.lnk"
  Delete "$SMPROGRAMS\Cetele.lnk"
!macroend
