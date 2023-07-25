/*// ---------- ---------- ----------
    Name :
        Composite Opener
    Description :
        特定のコンポをタイムラインウィンドウで開いたり閉じたりする
        初期の実行時に同フォルダに[CompositeOpener_setting.json]，[CoOpener_List.json]が無いとエラる
    Versions :
        v009 (23/07/18) 
            small fix、ワイルドカードと数字(d{2})対応、デバッグモードの実装、jsonエラーの対応
        v000-008 (23/07/18) 
            Initial Release
*/// ---------- ---------- ----------

/*// モジュールスコープの変数 ----------
*/// ------------------------------
debugLog("------------------------------");
var windowName = "Composite Opener v009" //名前

// デバッグモード
var isDebugMode = true;

// JSONファイルへのパスを取得
var scriptFile = new File($.fileName);
var scriptPath = scriptFile.path;
var settingFilePath = File(scriptPath + "/CompositeOpener_setting.json");
debugLog("settingFilePath : "+settingFilePath.toString());

var settings = readJsonFile(settingFilePath); // Read settings from json file
var listFilePath = new File(settings.listPath); // Set the list file path from settings
debugLog("listFilePath : "+listFilePath.toString());

var lists = readJsonFile(listFilePath);

// "閉じる(C)" のメニューコマンドIDを取得
var closeID = app.findMenuCommandId("閉じる(C)");
// 閉じるコマンドが有効なものであるか確認
if (closeID <= 0) {
    alert('"閉じる(C)" は適切なMenuCommandではありません');
    throw new Error('"閉じる(C)" は適切なMenuCommandではありません');
}


/*// [UI] Layout define ----------
*/// ------------------------------
var win = new Window("palette", windowName, undefined);
win.orientation = "column";
win.margins = 5;
win.spacing = 5;

// [UI>group] リストファイル
var grp_listPath = win.add("group", undefined);
grp_listPath.orientation = "row";
grp_listPath.margins = 3;
grp_listPath.spacing = 5;
// [UI>edittext] リストファイル名確認
var listPathPanel = grp_listPath.add("panel",[0, 0, 120, 20]);
listPathPanel.margins = 0;
listPathPanel.spacing = 0;
var listPathText = listPathPanel.add('statictext', [0, 0, 120, 20], getFilenameWithoutExtension((new File(settings.listPath)).name));
// [UI>button] リストファイル名変更
var listPathUpdateButton = grp_listPath.add('button', [0, -10, 22, 10], '...');
// [UI>button] 設定保存
var saveSettingButton = grp_listPath.add("button", [00, 0, 28, 20], "Save");  // Move saveSettingButton inside grp_listPath and to the right

// [UI>group] ラジオボタンとドロップダウンリスト
var grp_ChooseSetting = win.add("group", undefined);
grp_ChooseSetting.orientation = "column";
grp_ChooseSetting.margins = 3;
grp_ChooseSetting.spacing = 5;
// [UI>radioButtons],[dropDownLists]
var radioButtons = [];
var dropDownLists = [];
// [UI] Create the radio buttons and assign click handlers
for (var i = 0; i < 5; i++) {
    var group = grp_ChooseSetting.add("group", undefined);
    group.orientation = "row";
    group.spacing = 0;
    radioButtons[i] = group.add("radiobutton", [0, 5, 20, 20], "");
    dropDownLists[i] = group.add("dropdownlist", [0, 0, 120, 20], getListKeys());
}

// [UI>group] 実行
var grp_run = win.add("group", undefined);
grp_ChooseSetting.margins = 3;
grp_ChooseSetting.spacing = 5;
// [UI>button] Run
var runButton = grp_run.add("button", [0, 0, 86, 28], "Run");
// [UI>group] runOption
var grp_runOption = grp_run.add("group", undefined);
grp_runOption.orientation = "column";
grp_runOption.margins = 0;
grp_runOption.spacing = 0;
// [UI>checkbox] Close Other
var closeOtherButton = grp_runOption.add("checkbox", [0, 0, 72, 16], "Close Other");
// [UI>checkbox] Inverse
var inverseButton = grp_runOption.add("checkbox", [0, 0, 72, 16], "Inverse");


/*// 関数 ----------
*/// ------------------------------

// デバッグログを出力
function debugLog(message) {
    if (isDebugMode) {
        $.writeln(message);
    }
}

// 「ワイルドカード(".","*")」または「数字(\d)」を含むかどうかをチェック
function containsWildcardOrDigit(str) {
    return /[\.\*]|\\d/.test(str);
}

//ファイル名の中で最後に現れる"."（ピリオド）の位置を見つけ、その位置までの部分文字列を返す
function getFilenameWithoutExtension(filename) {
    return filename.slice(0, filename.lastIndexOf("."));
}

// jsonの読み取り
function readJsonFile(file) {
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
function writeJsonStringToFile(jsonString, filePath) {
    try {
        var file = new File(filePath);
        file.encoding = 'UTF-8'; // set encoding
        debugLog("file : "+file.toString());
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
function getKeys(obj) {
    var keys = [];
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            keys.push(key);
        }
    }
    return keys;
}
// Create a new function to get keys and add an empty option
function getListKeys() {
    var listKeys = getKeys(lists);
    listKeys.push('');
    return listKeys;
}

// Function to get filename without extension
function getFilename(filePath) {
    return getFilenameWithoutExtension((new File(filePath)).name);
}

// Function getRelativePath
function getRelativePath(file, base) {
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

//  コンポの表示を切り替える(コア処理)
function showCompos(compNames, closeOther, inverse) {
    debugLog("Run function openCompos");
    // 変数の確認
    debugLog("compNames : ["+compNames.toString()+"]"); // 対象コンポArray = ["コンポA"]
    debugLog("closeOther : "+closeOther.toString()); // 対象以外を閉じる = true / false
    debugLog("inverse : "+inverse.toString()); // 処理逆転 = true / false

    // 処理本体（対象のコンポを開く/閉じる）
    var i, j, item;

    if (closeOther && !inverse) {
        // Close all first, then open matching comps
        debugLog("Close all first, then open matching comps");
        for (i = 1; i <= app.project.numItems; i++) {
            item = app.project.item(i);
            if (item instanceof CompItem) {
                app.project.item(i).openInViewer();
                app.executeCommand(closeID);
            }
        }
        for (j = 0; j < compNames.length; j++) {
            for (i = 1; i <= app.project.numItems; i++) {
                item = app.project.item(i);
                if (item instanceof CompItem && item.name.match(new RegExp(compNames[j]))) {
                    item.openInViewer();
                    if (!containsWildcardOrDigit(compNames[j])) { // If there's no wildcard, break after the first match
                        break;
                    }
                }
            }
        }
    } else if (!closeOther && inverse) {
        // Close matching comps
        debugLog("Close matching comps");
        for (j = 0; j < compNames.length; j++) {
            for (i = 1; i <= app.project.numItems; i++) {
                item = app.project.item(i);
                if (item instanceof CompItem && item.name.match(new RegExp(compNames[j]))) {
                    app.project.item(i).openInViewer();
                    app.executeCommand(closeID);
                    if (!containsWildcardOrDigit(compNames[j])) { // If there's no wildcard, break after the first match
                        break;
                    }
                }
            }
        }
    } else if (closeOther && inverse) {
        // Open all first, then close matching comps
        debugLog("Open all first, then close matching comps");
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
                    app.executeCommand(closeID);
                    if (!containsWildcardOrDigit(compNames[j])) { // If there's no wildcard, break after the first match
                        break;
                    }
                }
            }
        }
    } else {
        // Default case: just open matching comps
        debugLog("Default case: just open matching comps");
        for (j = 0; j < compNames.length; j++) {
            for (i = 1; i <= app.project.numItems; i++) {
                item = app.project.item(i);
                if (item instanceof CompItem && item.name.match(new RegExp(compNames[j]))) {
                    item.openInViewer();
                    if (!containsWildcardOrDigit(compNames[j])) { // If there's no wildcard, break after the first match
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
for (var i = 0; i < 5; i++) {
    // Set dropdown to the current setting (ドロップダウンを現在の設定にする)
    if (settings.dropDownSettings[i]) {
        var idx = dropDownLists[i].find(settings.dropDownSettings[i]);
        if (idx !== -1) {
            dropDownLists[i].selection = idx;
        } else {
            dropDownLists[i].selection = null; // Set to null if there is no current setting
        }
    } else {
        dropDownLists[i].selection = null; // Set to null if there is no current setting
    }

    // Set radio button to the current state
    radioButtons[i].value = settings.currentRadio[i];
}

win.show();

/*// イベントハンドラ ----------
*/// ------------------------------

// saveSettingButton
saveSettingButton.onClick = function() {
    // Update settings based on current state
    settings.listPath = settings.listPath;

    settings.currentRadio = radioButtons.map(function(button) {
        return button.value;
    });

    settings.dropDownSettings = dropDownLists.map(function(list, index) {
        return list.selection ? list.selection.text : "";
    });

    // Save JSON string to a file
    var jsonString = JSON.stringify(settings, null, 4); // Convert settings object to JSON string // Use 4 spaces for indentation
    var filePath = (scriptPath + "/CompositeOpener_setting.json");
    writeJsonStringToFile(jsonString, filePath);
};

// Update dropdown lists in the button onClick
listPathUpdateButton.onClick = function() {
    var newFile = File.openDialog("Select a new list file");
    if (newFile) {
        listPathText.text = getFilename(newFile.absoluteURI);  // Use the new function
        settings.listPath = newFile.fsName;  // Use absolute path
        listFilePath = newFile;  // Update listFilePath
        lists = readJsonFile(newFile);  // Update the global lists object
        
        // newItems
        var newItems = getListKeys(lists);  // Pass the new list object
        debugLog("newItems.length : "+(newItems.length)); 
        
        // Update dropdown lists
        for (var i = 0; i < 5; i++) {
            // items の更新
            dropDownLists[i].removeAll(); // 初期化
            for (var j = 0; j < newItems.length; j++) {
                dropDownLists[i].add('item', newItems[j]);  // Add new items
            }
            // Set the selection in the json to the first item if it exists
            if (newItems[i] != null) {
                dropDownLists[i].selection = [i];
            } else {
                dropDownLists[i].selection = null;
            }
        }
    }
};

// Handle radio button clicks outside of the loop
for (var i = 0; i < radioButtons.length; i++) {
    radioButtons[i].onClick = function() {
        var index = radioButtons.indexOf(this);
        for (var j = 0; j < radioButtons.length; j++) {
            if (j !== index) {
                radioButtons[j].value = false;
            }
        }
    };
};

// runButton
runButton.onClick = function () {
    var selectedList;
    for (var i = 0; i < radioButtons.length; i++) {
        if (radioButtons[i].value) {
            selectedList = dropDownLists[i].selection.text;
            break;
        }
    }
    debugLog("selectedList : "+selectedList);
    if (selectedList) {
        //  listData を作成 ← JSONファイルの配列から
        debugLog("リストデータパス:"+listFilePath.toString());
        var listFile = new File(listFilePath);
        listFile.open('r');
        var listData = JSON.parse(listFile.read());
        listFile.close(); // json 閉じる
        
        // "selectedList"の配列を読み込む
        var compNames = listData[selectedList];
        
        showCompos(compNames, closeOtherButton.value, inverseButton.value);
        //
        alert("Running with: " + selectedList);
    } else {
        alert("Please select an option.");
    }
};

