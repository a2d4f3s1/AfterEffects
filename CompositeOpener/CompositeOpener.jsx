/*// ---------- ---------- ----------
    Name :
        Composite Opener
    Description :
        特定のコンポをタイムラインウィンドウで開いたり閉じたりする
        初期の実行時に同フォルダに[CompositeOpener_setting.json]，[CoOpener_List.json]が無いとエラる
    Rights : 
        These codes are licensed under CC0.
        http://creativecommons.org/publicdomain/zero/1.0/deed.ja
    Versions :
        v012 (23/07/24) (Auther : MOTEKI Kunio)
            リスト増減時のラジオボタンエラー対応、変数名の重複対応
        v011 (23/07/19) (Auther : MOTEKI Kunio)
            リストの増減に対応、リストjsonに初期のリスト数を追加
        v010 (23/07/14) (Auther : MOTEKI Kunio)
            'Program Files' 対応で 'CompositeOpener_exe.jsx' を作成、デバッグ初期値OFF、
            リストパスが切れてた時に本体パスを探す処理追加、small fix
        v009 (23/07/13) (Auther : MOTEKI Kunio)
            small fix、ワイルドカードと数字(d{2})対応、デバッグモードの実装、jsonエラーの対応
        v000-008 (23/07/13) (Auther : MOTEKI Kunio)
            Initial Release
*/// ---------- ---------- ----------

/*// モジュールスコープの変数 ----------
*/// ------------------------------
var CO_windowName = "Composite Opener v012" //名前
COFn_debugLog("----- "+CO_windowName+" -------------------------");

// デバッグモード
var CO_isDebugMode = false;

// JSONファイルへのパスを取得
var CO_scriptFile = new File($.fileName);
var CO_scriptPath = CO_scriptFile.path;
var CO_settingFilePath = File(CO_scriptPath + "/CompositeOpener_setting.json");
COFn_debugLog("CO_settingFilePath : "+CO_settingFilePath.toString());
var CO_settings = COFn_readJsonFile(CO_settingFilePath); // Read settings from json file
var CO_listFilePath = COFn_findValidFilePath(CO_settings.listPath); // リストパスが切れてたら探し直し
COFn_debugLog("CO_listFilePath : "+CO_listFilePath.toString());

var CO_listJson = COFn_readJsonFile(CO_listFilePath);  // JSON ファイル全体を読み込む
var CO_numOfRows = CO_listJson.numOfRows;  // "numOfRows" を取り出す
var CO_lists = CO_listJson.patterns;  // "patterns" を取り出す
COFn_debugLog("CO_lists : "+CO_lists.toString());

// "閉じる(C)" のメニューコマンドIDを取得
var CO_closeID = app.findMenuCommandId("閉じる(C)");
// 閉じるコマンドが有効なものであるか確認
if (CO_closeID <= 0) {
    alert('"閉じる(C)" は適切なMenuCommandではありません');
    throw new Error('"閉じる(C)" は適切なMenuCommandではありません');
}


/*// [UI] Layout define ----------
*/// ------------------------------
var CO_win = new Window("palette", CO_windowName, undefined);
CO_win.orientation = "column";
CO_win.margins = 5;
CO_win.spacing = 5;

// [UI>group] リストファイル
var CO_grp_listPath = CO_win.add("group", undefined);
CO_grp_listPath.orientation = "row";
CO_grp_listPath.margins = 3;
CO_grp_listPath.spacing = 5;
// [UI>edittext] リストファイル名確認
var CO_listPathPanel = CO_grp_listPath.add("panel",[0, 0, 84, 24]);
CO_listPathPanel.margins = 0;
CO_listPathPanel.spacing = 0;
var CO_listPathText = CO_listPathPanel.add('statictext', [0, 0, 80, 20], COFn_getFilenameWithoutExtension((new File(CO_settings.listPath)).name));
// [UI>button] リストファイル名変更
var CO_listPathUpdateButton = CO_grp_listPath.add('button', [0, -10, 22, 10], '...');
// [UI>button] 設定保存
var CO_saveSettingButton = CO_grp_listPath.add("button", [00, 0, 28, 20], "Save");  // Move CO_saveSettingButton inside CO_grp_listPath and to the right

// [UI>group] ラジオボタンとドロップダウンリスト
var CO_grp_ChooseSetting = CO_win.add("group", undefined);
CO_grp_ChooseSetting.orientation = "column";
CO_grp_ChooseSetting.margins = 2;
CO_grp_ChooseSetting.spacing =3;
// [UI>CO_radioButtons],[CO_dropDownLists]
var CO_radioButtons = [];
var CO_dropDownLists = [];
// [UI>group] Buttons for adding and removing lines
var CO_grp_buttons = CO_win.add("group", undefined);
CO_grp_buttons.orientation = "row";
CO_grp_buttons.margins = 2;
CO_grp_buttons.spacing = 8;
var CO_addButton = CO_grp_buttons.add("button", [0, 0, 50, 16], "+");
var CO_removeButton = CO_grp_buttons.add("button", [0, 0, 50, 16], "-");
// Now create the initial lines based on the dropDownSettings count
var CO_initialLines = Math.max(5, CO_settings.dropDownSettings.length); // Ensure we have at least 5 lines
// [UI] Create the radio buttons and assign click handlers
for (var i = 0; i < CO_initialLines; i++) {
    COFn_addLine();
}

// [UI>group] 実行
var CO_grp_run = CO_win.add("group", undefined);
CO_grp_run.margins = 0;
CO_grp_run.spacing = 0;
// [UI>button] Run
var CO_runButton = CO_grp_run.add("button", [0, 0, 72, 28], "Run");
// [UI>group] runOption
var CO_grp_runOption = CO_grp_run.add("group", undefined);
CO_grp_runOption.orientation = "column";
CO_grp_runOption.margins = 3;
CO_grp_runOption.spacing = 0;
// [UI>checkbox] Close Other
var CO_closeOtherButton = CO_grp_runOption.add("checkbox", [0, 0, 68, 16], "CloseOther");
// [UI>checkbox] Inverse
var CO_inverseButton = CO_grp_runOption.add("checkbox", [0, 0, 68, 16], "Inverse");


/*// 関数 ----------
*/// ------------------------------

// デバッグログを出力
function COFn_debugLog(message) {
    if (CO_isDebugMode) {
        $.writeln(decodeURI(message));
    }
}

// 「ワイルドカード(".","*")」または「数字(\d)」を含むかどうかをチェック
function COFn_containsWildcardOrDigit(str) {
    return /[\.\*]|\\d/.test(str);
}

// 与えられたパスのリストを順に試し、最初に見つかった存在するファイルのパスを返す
function COFn_findValidFilePath(initialPath) {
    var initialFilePath = new File(initialPath);

    if (initialFilePath.exists) {
        COFn_debugLog("return initialFilePath");
        return initialFilePath;
    } else {
        // ファイル名のみ抽出
        var fileName = initialFilePath.name; 

        // 新しいパスを構築
        var newPath = CO_scriptPath + "/" + fileName;
        var newFilePath = new File(newPath);
        
        if (newFilePath.exists) {
            COFn_debugLog("return newFilePath");
            return newFilePath;
        } else {
            // 初期値を返す
            COFn_debugLog("return defaultPath");
            return (new File(CO_scriptPath + "/CoOpener_List.json"));
        }
    }
}

//ファイル名の中で最後に現れる"."（ピリオド）の位置を見つけ、その位置までの部分文字列を返す
function COFn_getFilenameWithoutExtension(filename) {
    return filename.slice(0, filename.lastIndexOf("."));
}

// jsonの読み取り
function COFn_readJsonFile(file) {
    try {
        file.open('r');
        var data = file.read();
        file.close();
        return JSON.parse(data);
    } catch (err) {
        alert("ファイルの読み取りに失敗しました: " + err.message);
        return null;
    }
}

// Write a JSON string to a file (JSON文字列をファイルに書き込む)
function COFn_writeJsonStringToFile(jsonString, filePath) {
    try {
        var file = new File(filePath);
        file.encoding = 'UTF-8'; // set encoding
        COFn_debugLog("file : "+file.toString());
        file.open("w");  // Open file for writing
        var result = file.write(jsonString);
        file.close();
        
        // Show a message to confirm that settings have been saved
        alert("Settings have been saved.");
        
        return result;
    } catch (err) {
        alert("ファイルの書き込みに失敗しました: " + err.message);
    }
}

//
function COFn_getKeys(obj) {
    var keys = [];
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            keys.push(key);
        }
    }
    return keys;
}
// Create a new function to get keys and add an empty option
function COFn_getListKeys() {
    var listKeys = COFn_getKeys(CO_lists);
    listKeys.push('');
    return listKeys;
}

// Function to get filename without extension
function COFn_getFilename(filePath) {
    return COFn_getFilenameWithoutExtension((new File(filePath)).name);
}

// Function COFn_getRelativePath
function COFn_getRelativePath(file, base) {
    var fileParts = file.split('/');
    var baseParts = base.split('/');
    var relativeParts = [];

    while (fileParts.length && baseParts.length && fileParts[0] == baseParts[0]) {
        fileParts.shift();
        baseParts.shift();
    }

    for (var i = 0; i < baseParts.length; i++) {
        relativeParts.push('..');
    }
    relativeParts = relativeParts.concat(fileParts);

    return relativeParts.join('/');
}

// UIリロード
function COFn_redrawUI() {
    CO_win.layout.layout(true);  // Redraw the UI
    CO_listPathPanel.size.width = 80;  // Resize the CO_listPathPanel after redrawing the UI
}

// Handle radio button clicks outside of the loop (ラジオボタンクリック時の処理を設定)
function COFn_handleRadioButtonClicks() {
    for (var i = 0; i < CO_radioButtons.length; i++) {
        CO_radioButtons[i].onClick = function() {
            var index = CO_radioButtons.indexOf(this);
            for (var j = 0; j < CO_radioButtons.length; j++) {
                if (j !== index) {
                    CO_radioButtons[j].value = false;
                }
            }
        };
    };
    COFn_debugLog("CO_radioButtons.length:"+(CO_radioButtons.length).toString());
}

// ラジオボタン/DDリスト 追加
function COFn_addLine() {
    var i = CO_radioButtons.length;
    var group = CO_grp_ChooseSetting.add("group", undefined);
    group.orientation = "row";
    group.spacing = 0;
    CO_radioButtons[i] = group.add("radiobutton", [0, 5, 20, 20], "");
    CO_dropDownLists[i] = group.add("dropdownlist", [0, 0, 120, 20], COFn_getListKeys());
}
// ラジオボタン/DDリスト 削除
function COFn_removeLine() {
    if (CO_radioButtons.length > 0) {
        CO_grp_ChooseSetting.remove(CO_radioButtons[CO_radioButtons.length - 1].parent);
        CO_radioButtons.pop();
        CO_dropDownLists.pop();
    }
}

//  コンポの表示を切り替える(コア処理)
function COFn_showCompos(compNames, closeOther, inverse) {
    COFn_debugLog("Run function openCompos");
    // 変数の確認
    COFn_debugLog("compNames : ["+compNames.toString()+"]"); // 対象コンポArray = ["コンポA"]
    COFn_debugLog("closeOther : "+closeOther.toString()); // 対象以外を閉じる = true / false
    COFn_debugLog("inverse : "+inverse.toString()); // 処理逆転 = true / false

    // 処理本体（対象のコンポを開く/閉じる）
    var i, j, item;

    if (closeOther && !inverse) {
        // Close all first, then open matching comps
        COFn_debugLog("Close all first, then open matching comps");
        for (i = 1; i <= app.project.numItems; i++) {
            item = app.project.item(i);
            if (item instanceof CompItem) {
                app.project.item(i).openInViewer();
                app.executeCommand(CO_closeID);
            }
        }
        for (j = 0; j < compNames.length; j++) {
            for (i = 1; i <= app.project.numItems; i++) {
                item = app.project.item(i);
                if (item instanceof CompItem && item.name.match(new RegExp(compNames[j]))) {
                    item.openInViewer();
                    if (!COFn_containsWildcardOrDigit(compNames[j])) { // If there's no wildcard, break after the first match
                        break;
                    }
                }
            }
        }
    } else if (!closeOther && inverse) {
        // Close matching comps
        COFn_debugLog("Close matching comps");
        for (j = 0; j < compNames.length; j++) {
            for (i = 1; i <= app.project.numItems; i++) {
                item = app.project.item(i);
                if (item instanceof CompItem && item.name.match(new RegExp(compNames[j]))) {
                    app.project.item(i).openInViewer();
                    app.executeCommand(CO_closeID);
                    if (!COFn_containsWildcardOrDigit(compNames[j])) { // If there's no wildcard, break after the first match
                        break;
                    }
                }
            }
        }
    } else if (closeOther && inverse) {
        // Open all first, then close matching comps
        COFn_debugLog("Open all first, then close matching comps");
        for (i = 1; i <= app.project.numItems; i++) {
            item = app.project.item(i);
            if (item instanceof CompItem) {
                item.openInViewer();
            }
        }
        for (j = 0; j < compNames.length; j++) {
            for (i = 1; i <= app.project.numItems; i++) {
                item = app.project.item(i);
                if (item instanceof CompItem && item.name.match(new RegExp(compNames[j]))) {
                    app.project.item(i).openInViewer();
                    app.executeCommand(CO_closeID);
                    if (!COFn_containsWildcardOrDigit(compNames[j])) { // If there's no wildcard, break after the first match
                        break;
                    }
                }
            }
        }
    } else {
        // Default case: just open matching comps
        COFn_debugLog("Default case: just open matching comps");
        for (j = 0; j < compNames.length; j++) {
            for (i = 1; i <= app.project.numItems; i++) {
                item = app.project.item(i);
                if (item instanceof CompItem && item.name.match(new RegExp(compNames[j]))) {
                    item.openInViewer();
                    if (!COFn_containsWildcardOrDigit(compNames[j])) { // If there's no wildcard, break after the first match
                        break;
                    }
                }
            }
        }
    }
    // 終わり
}

/*// 実行コード ----------
*/// ------------------------------

// Set initial state
var maxLen = Math.min(CO_settings.dropDownSettings.length, CO_dropDownLists.length, CO_radioButtons.length, CO_settings.currentRadio.length);
for (var i = 0; i < maxLen; i++) {
    // Set dropdown to the current setting (ドロップダウンを現在の設定にする)
    if (CO_settings.dropDownSettings[i]) {
        var idx = CO_dropDownLists[i].find(CO_settings.dropDownSettings[i]);
        if (idx !== -1) {
            CO_dropDownLists[i].selection = idx;
        } else {
            CO_dropDownLists[i].selection = null; // Set to null if there is no current setting
        }
    } else {
        CO_dropDownLists[i].selection = null; // Set to null if there is no current setting
    }

    // Set radio button to the current state
    CO_radioButtons[i].value = CO_settings.currentRadio[i];
}

// ラジオボタンが同時にTrueにならないように
COFn_handleRadioButtonClicks();

CO_win.show();

/*// イベントハンドラ ----------
*/// ------------------------------

// saveSettingButton (設定保存ボタン)
CO_saveSettingButton.onClick = function() {
    // Update settings based on current state
    CO_settings.listPath = CO_settings.listPath;
     // ラジオボタンの設定
    CO_settings.currentRadio = CO_radioButtons.map(function(button) {
        return button.value;
    });
     // ドロップダウンリストの設定
    CO_settings.dropDownSettings = CO_dropDownLists.map(function(list, index) {
        return list.selection ? list.selection.text : "";
    });
    // Save JSON string to a file
    var jsonString = JSON.stringify(CO_settings, null, 4); // Convert settings object to JSON string // Use 4 spaces for indentation
    var filePath = (CO_scriptPath + "/CompositeOpener_setting.json");
    COFn_writeJsonStringToFile(jsonString, filePath);
};

// Update dropdown lists in the button onClick (ボタンのドロップダウン リストを更新)
CO_listPathUpdateButton.onClick = function() {
    CO_listFilePath = COFn_findValidFilePath(CO_settings.listPath); // リストパスが切れてたら探し直し
    COFn_debugLog("CO_listFilePath : "+CO_listFilePath.toString());
    var newFile = (File(CO_listFilePath.path)).openDlg("Select a new list file");
    
    if (newFile) {
        CO_listPathText.text = COFn_getFilename(newFile.absoluteURI);  // Use the new function
        CO_settings.listPath = newFile.fsName;  // Use absolute path
        CO_listFilePath = newFile;  // Update listFilePath
        
        CO_listJson = COFn_readJsonFile(newFile);  // Update the global CO_listJson object
        CO_numOfRows = Math.max(5, CO_listJson.numOfRows);  // Update numOfRows, ensuring it's not less than 5
        CO_lists = CO_listJson.patterns;  // Update lists
        
        // newItems
        var newItems = COFn_getListKeys(CO_lists);  // Pass the new list object
        COFn_debugLog("newItems.length : "+(newItems.length)); 
        
        
        // Update dropdown lists
        while (CO_dropDownLists.length > CO_numOfRows) {
            COFn_removeLine();  // remove excess lines
            COFn_redrawUI(); // Redraw the UI
        }
        while (CO_dropDownLists.length < CO_numOfRows) {
            COFn_addLine();  // add additional lines
            COFn_redrawUI(); // Redraw the UI
        }
        for (var i = 0; i < CO_numOfRows; i++) {
            // Update items
            CO_dropDownLists[i].removeAll(); // Clear current items
            for (var j = 0; j < newItems.length; j++) {
                CO_dropDownLists[i].add('item', newItems[j]);  // Add new items
            }
            // Set the selection in the json to the first item if it exists
            if (newItems[i] != null) {
                CO_dropDownLists[i].selection = [i];
            } else {
                CO_dropDownLists[i].selection = null;
            }
        }
    }
};

// ライン追加ボタン
CO_addButton.onClick = function() {
    COFn_addLine();
    COFn_handleRadioButtonClicks();
    COFn_redrawUI(); // Redraw the UI
}
// ライン削除ボタン
CO_removeButton.onClick = function() {
    COFn_removeLine();
    COFn_handleRadioButtonClicks();
    COFn_redrawUI(); // Redraw the UI
}

// CO_runButton
CO_runButton.onClick = function () {
    var selectedList;
    for (var i = 0; i < CO_radioButtons.length; i++) {
        if (CO_radioButtons[i].value) {
            selectedList = CO_dropDownLists[i].selection.text;
            break;
        }
    }
    COFn_debugLog("selectedList : "+selectedList);
    if (selectedList) {
        //  listData を作成 ← JSONファイルの配列から
        COFn_debugLog("リストデータパス:"+CO_listFilePath.toString());
        var listFile = new File(CO_listFilePath);
        listFile.open('r');
        var listData = JSON.parse(listFile.read());
        listFile.close(); // json 閉じる
        
        // "selectedList"の配列を読み込む
        var compNames = listData.patterns[selectedList];
        
        COFn_showCompos(compNames, CO_closeOtherButton.value, CO_inverseButton.value);
        //
        alert("Running with: " + selectedList);
    } else {
        alert("Please select an option.");
    }
};

