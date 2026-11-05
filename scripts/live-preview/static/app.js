/* Adapted from PPT Master svg_editor at 78759bf62e9a1ef43e926ff9e50afa4cfe9a63cb.
 * Copyright (c) 2025-2026 Hugo He. MIT; see THIRD_PARTY_NOTICES.md.
 */
/* ============================================================
   VibeResume - HTML Editor  |  app.js
   Vanilla JS, IIFE pattern
   ============================================================ */
(function () {
    "use strict";

    // ---- i18n -------------------------------------------------------
    var MESSAGES = {
        en: {
            page_title: "VibeResume - Live Preview",
            panel_slides: "Slides",
            panel_edit_annotate: "Edit / Annotate",
            placeholder_select_slide: "Select a slide on the left to begin",
            label_selected_element: "Selected element",
            empty_selected_element: "Click an element on the slide to select it",
            btn_select_group: "Select parent group",
            label_batch_edit: "Batch edit",
            label_group_edit: "Group edit",
            section_geometry: "Geometry",
            section_style: "Style",
            section_text_style: "Text",
            section_raw_attrs: "Raw attributes",
            label_edit_instruction: "Edit instruction",
            pending_none: "No pending changes",
            pending_summary: "{edits} direct edit(s), {annotations} annotation page(s) pending",
            pending_pages: "Pages: {pages}",
            quick_align: "Align / move",
            quick_resize: "Resize",
            quick_replace_image: "Replace image",
            quick_copy: "Revise copy",
            quick_relayout: "Relayout area",
            placeholder_annotation: "Describe how the AI should modify this element...",
            placeholder_annotation_multi: "Describe how to modify all {count} elements...",
            btn_add_annotation: "Add annotation",
            label_annotations_on_slide: "Annotations on this slide",
            btn_submit_annotations: "Apply changes",
            btn_exit_preview: "Exit preview",
            modal_submit: "Submit",
            modal_cancel: "Cancel",
            empty_waiting_slides: "Waiting for generated slides...",
            empty_no_slides: "No slides found",
            placeholder_live_ready: "Live preview is ready. Generated slides will appear here.",
            placeholder_slide_writing: "Slide is still being written. Waiting for the next refresh...",
            empty_annotations: "No annotations yet",
            tooltip_remove_annotation: "Remove annotation",
            multi_selected: "{count} elements selected",
            multi_mixed: "mixed",
            err_load_slides: "Failed to load slides: ",
            err_load_slide: "Failed to load slide: ",
            err_add_annotation: "Failed to add annotation: ",
            err_remove_annotation: "Failed to remove annotation: ",
            err_save: "Save failed: ",
            err_exit: "Could not stop preview: ",
            err_edit: "Edit failed: ",
            label_direct_edit: "Object attributes (pending until Apply changes)",
            prop_multiline_hint: "Contains nested markup. Select a text element, or annotate the whole region for AI.",
            edit_saved_hint: "Change staged. Click Apply changes to write it to HTML.",
            btn_undo: "Undo",
            undo_done: "Reverted last staged edit",
            undo_empty: "No staged edit to undo",
            overlap_caption: "Overlapping here — pick one",
            err_empty_svg: "Slide loaded but the canvas is empty. The SVG may be malformed or missing a root <svg> element.",
            warn_icon_inline: "{count} icon(s) failed to render: {names}",
            warn_matrix_transform: "This geometry edit is stored as a transform matrix. Preview is exact; PDF export depends on matrix-aware conversion.",
            modal_matrix_transform_note: "\n\nNote: at least one staged geometry edit uses a transform matrix. Re-export with the current PDF exporter so the matrix is applied.",
            slide_error_tooltip: "Failed to parse this slide: ",
            reload_banner: "This slide was updated on disk. Click to reload.",
            conflict_banner: "The source changed after edits were staged. Exit preview and restart it; the conflicting draft will be archived in live_preview for recovery.",
            modal_confirm_submit: "Apply staged direct edits and AI annotations to disk?\n\nThe preview service will keep running. Click Exit preview when you want to stop it.",
            modal_success_submit: "Changes saved to HTML.\n\nThe preview service is still running.",
            modal_success_direct_only: "Changes saved to HTML.\n\nDirect edits are now in the HTML source. Return to the chat and ask to re-export when you want a refreshed PDF. The preview service is still running.",
            modal_success_annotations_only: "Annotations saved to HTML.\n\nReturn to the chat and ask to apply annotations when you want AI to interpret them. The preview service is still running.",
            modal_success_mixed: "Direct edits and annotations saved to HTML.\n\nReturn to the chat to apply AI-needed annotations, then re-export the PDF when ready. The preview service is still running.",
            modal_confirm_exit: "Exit preview and stop the local server?\n\nUnapplied edits and annotations are kept as a draft and restored the next time the preview opens.",
            modal_nothing_applied: "The server had no pending changes, so nothing was written. It may have restarted since these changes were made; re-check the edits and annotations on each slide.",
            warn_draft_unsaved: "Could not save the draft to disk. This change is staged in memory only and is lost if the server stops before Apply changes.",
            notice_draft_restored: "Restored the unapplied draft for {count} slide(s): {pages}. Click Apply changes when ready.",
            warn_draft_conflict: "{pages} changed on disk after the draft was saved, so that draft was not restored. It is kept in live_preview/{file}.",
            warn_draft_unreadable: "The draft file could not be read. It is kept as live_preview/{file}.",
            modal_success_exit: "Preview stopped.\n\nYou can close this tab and return to the chat.",
            modal_stopping: "Stopping preview server...",
            lang_toggle_title: "Switch language",
            nav_first: "First slide (Home)",
            nav_prev: "Previous slide (←)",
            nav_next: "Next slide (→)",
            nav_last: "Last slide (End)",
            nav_counter: "{current} / {total}",
            nav_empty: "— / —"
        },
        ja: {
            page_title: "VibeResume - ライブプレビュー",
            panel_slides: "ページ",
            panel_edit_annotate: "編集 / コメント",
            placeholder_select_slide: "左のページを選択してください",
            label_selected_element: "選択中の要素",
            empty_selected_element: "ページ上の要素をクリックすると選択できます",
            btn_select_group: "親グループを選択",
            label_batch_edit: "一括編集",
            label_group_edit: "グループ編集",
            section_geometry: "位置・サイズ",
            section_style: "スタイル",
            section_text_style: "テキスト",
            section_raw_attrs: "SVG属性",
            label_edit_instruction: "編集指示",
            pending_none: "未適用の変更はありません",
            pending_summary: "直接編集{edits}件、コメントを変更したページ{annotations}件が未適用",
            pending_pages: "対象ページ：{pages}",
            quick_align: "整列 / 移動",
            quick_resize: "サイズ変更",
            quick_replace_image: "画像の差し替え",
            quick_copy: "文言の修正",
            quick_relayout: "領域のレイアウト変更",
            placeholder_annotation: "この要素をAIにどう修正してほしいかを入力…",
            placeholder_annotation_multi: "選択した{count}個の要素すべてをどう修正するかを入力…",
            btn_add_annotation: "コメントを追加",
            label_annotations_on_slide: "このページのコメント",
            btn_submit_annotations: "変更を適用",
            btn_exit_preview: "プレビューを終了",
            modal_submit: "適用",
            modal_cancel: "キャンセル",
            empty_waiting_slides: "ページの生成を待っています…",
            empty_no_slides: "ページが見つかりません",
            placeholder_live_ready: "ライブプレビューの準備ができました。生成されたページがここに表示されます。",
            placeholder_slide_writing: "ページはまだ書き込み中です。次の更新を待っています…",
            empty_annotations: "コメントはまだありません",
            tooltip_remove_annotation: "コメントを削除",
            multi_selected: "{count}個の要素を選択中",
            multi_mixed: "混在",
            err_load_slides: "ページ一覧の読み込みに失敗しました：",
            err_load_slide: "ページの読み込みに失敗しました：",
            err_add_annotation: "コメントの追加に失敗しました：",
            err_remove_annotation: "コメントの削除に失敗しました：",
            err_save: "保存に失敗しました：",
            err_exit: "プレビューを停止できませんでした: ",
            err_edit: "編集に失敗しました：",
            label_direct_edit: "オブジェクト属性（「変更を適用」までは保留）",
            prop_multiline_hint: "子要素を含みます。テキスト要素を選択するか、AIへのコメントを追加してください。",
            edit_saved_hint: "変更は未適用です。「変更を適用」をクリックすると HTML に書き込まれます。",
            btn_undo: "元に戻す",
            undo_done: "直前の未適用の編集を元に戻しました",
            undo_empty: "元に戻せる編集はありません",
            overlap_caption: "要素が重なっています — 1つ選択してください",
            err_empty_svg: "ページは読み込めましたがキャンバスが空です。SVGが不正か、ルート<svg>要素がない可能性があります。",
            warn_icon_inline: "{count}個のアイコンを描画できませんでした：{names}",
            warn_matrix_transform: "この位置・サイズの編集は transform matrix として保存されます。プレビューは正確ですが、PDFへのエクスポートには matrix 対応のエクスポーターが必要です。",
            modal_matrix_transform_note: "\n\n注意：未適用の位置・サイズの編集のうち、少なくとも1件が transform matrix を使用しています。matrix が反映されるよう、現行のPDFエクスポーターで再エクスポートしてください。",
            slide_error_tooltip: "このページの解析に失敗しました：",
            reload_banner: "このページはディスク上で更新されました。クリックすると再読み込みします。",
            conflict_banner: "編集の一時保存後にソースが変更されました。プレビューを終了して再起動してください。競合した下書きは復元用に live_preview に保存されます。",
            modal_confirm_submit: "未適用の直接編集とAI向けコメントをディスクに書き込みますか？\n\nプレビューサーバーは動作を続けます。停止するには「プレビューを終了」をクリックしてください。",
            modal_success_submit: "変更を HTML に保存しました。\n\nプレビューサーバーは引き続き動作しています。",
            modal_success_direct_only: "変更を HTML に保存しました。\n\n直接編集はHTMLソースに反映済みです。PDFを更新したいときは、チャットに戻って再エクスポートを依頼してください。プレビューサーバーは引き続き動作しています。",
            modal_success_annotations_only: "コメントを HTML に保存しました。\n\nAIにコメントを解釈・反映させたいときは、チャットに戻ってコメントの適用を依頼してください。プレビューサーバーは引き続き動作しています。",
            modal_success_mixed: "直接編集とコメントを HTML に保存しました。\n\nチャットに戻ってAIの判断が必要なコメントの適用を先に依頼し、確認できたらPDFを再エクスポートしてください。プレビューサーバーは引き続き動作しています。",
            modal_confirm_exit: "プレビューを終了してローカルサーバーを停止しますか？\n\n未適用の編集とコメントは下書きとして保持され、次にプレビューを開いたときに復元されます。",
            modal_nothing_applied: "サーバーに未適用の変更がなかったため、何も書き込まれませんでした。変更後にサーバーが再起動した可能性があります。各ページの編集とコメントを確認してください。",
            warn_draft_unsaved: "下書きをディスクに保存できませんでした。この変更はメモリ上にのみあり、「変更を適用」の前にサーバーが停止すると失われます。",
            notice_draft_restored: "{count} 枚のページの未適用の下書きを復元しました：{pages}。準備ができたら「変更を適用」をクリックしてください。",
            warn_draft_conflict: "{pages} は下書きの保存後にディスク上で変更されたため、その下書きは復元されませんでした。live_preview/{file} に保持されています。",
            warn_draft_unreadable: "下書きファイルを読み込めませんでした。live_preview/{file} として保持されています。",
            modal_success_exit: "プレビューを停止しました。\n\nこのタブを閉じてチャットに戻れます。",
            modal_stopping: "プレビューサーバーを停止しています…",
            lang_toggle_title: "言語を切り替え",
            nav_first: "最初のページ (Home)",
            nav_prev: "前のページ (←)",
            nav_next: "次のページ (→)",
            nav_last: "最後のページ (End)",
            nav_counter: "{current} / {total}",
            nav_empty: "— / —"
        },
        zh: {
            page_title: "VibeResume - 实时预览",
            panel_slides: "简历页",
            panel_edit_annotate: "编辑 / 标注",
            placeholder_select_slide: "在左侧选择一张简历页开始",
            label_selected_element: "已选元素",
            empty_selected_element: "点击简历页中的元素进行选择",
            btn_select_group: "选择父级组合",
            label_batch_edit: "批量编辑",
            label_group_edit: "组合编辑",
            section_geometry: "位置与大小",
            section_style: "样式",
            section_text_style: "文本",
            section_raw_attrs: "原始属性",
            label_edit_instruction: "修改说明",
            pending_none: "没有待应用修改",
            pending_summary: "{edits} 条直接修改、{annotations} 个页面有 AI 标注待应用",
            pending_pages: "页面：{pages}",
            quick_align: "对齐 / 移动",
            quick_resize: "调整大小",
            quick_replace_image: "换图",
            quick_copy: "改文案",
            quick_relayout: "重排此区域",
            placeholder_annotation: "描述希望 AI 如何修改该元素……",
            placeholder_annotation_multi: "描述希望如何修改所选 {count} 个元素……",
            btn_add_annotation: "添加标注",
            label_annotations_on_slide: "本页标注",
            btn_submit_annotations: "应用修改",
            btn_exit_preview: "退出预览",
            modal_submit: "提交",
            modal_cancel: "取消",
            empty_waiting_slides: "正在等待生成简历页……",
            empty_no_slides: "未找到简历页",
            placeholder_live_ready: "实时预览已就绪，生成的简历页会在这里出现。",
            placeholder_slide_writing: "简历页仍在写入，等待下次刷新……",
            empty_annotations: "暂无标注",
            tooltip_remove_annotation: "删除标注",
            multi_selected: "已选 {count} 个元素",
            multi_mixed: "混合",
            err_load_slides: "加载简历页列表失败：",
            err_load_slide: "加载简历页失败：",
            err_add_annotation: "添加标注失败：",
            err_remove_annotation: "删除标注失败：",
            err_save: "保存失败：",
            err_exit: "无法停止预览：",
            err_edit: "编辑失败：",
            label_direct_edit: "对象属性（点击“应用修改”后写入）",
            prop_multiline_hint: "包含嵌套内容，请选择具体文字元素，或标注整个区域让 AI 修改",
            edit_saved_hint: "修改已暂存。点击“应用修改”后写入 HTML。",
            btn_undo: "撤销",
            undo_done: "已撤销上一条暂存修改",
            undo_empty: "没有可撤销的暂存修改",
            overlap_caption: "此处重叠元素——点击选择",
            err_empty_svg: "简历页已加载但画布为空。SVG 可能损坏或缺少根 <svg> 元素。",
            warn_icon_inline: "{count} 个图标渲染失败：{names}",
            warn_matrix_transform: "本次位置/大小修改会以 transform matrix 保存。预览是准确的；PDF 导出需要使用支持 matrix 的当前导出器。",
            modal_matrix_transform_note: "\n\n提示：至少有一条暂存的位置/大小修改使用了 transform matrix。请用当前 PDF 导出器重新导出，确保 matrix 被应用。",
            slide_error_tooltip: "该简历页解析失败：",
            reload_banner: "当前页已在磁盘上更新，点此重新加载。",
            conflict_banner: "暂存修改后源文件发生变化。请退出预览并重新启动；冲突草稿会归档到 live_preview，以便对照恢复。",
            modal_confirm_submit: "确认将暂存的直接修改和 AI 标注写入磁盘？\n\n预览服务会继续运行。需要关闭时请点击“退出预览”。",
            modal_success_submit: "修改已保存到 HTML。\n\n预览服务仍在运行。",
            modal_success_direct_only: "修改已保存到 HTML。\n\n直接修改已经写入 HTML 源文件；需要刷新 PDF 时，请回到对话窗口要求重新导出。预览服务仍在运行。",
            modal_success_annotations_only: "标注已保存到 HTML。\n\n需要 AI 理解并执行这些标注时，请回到对话窗口要求应用标注。预览服务仍在运行。",
            modal_success_mixed: "直接修改和标注已保存到 HTML。\n\n请回到对话窗口先应用需要 AI 判断的标注，确认后再重新导出 PDF。预览服务仍在运行。",
            modal_confirm_exit: "退出预览并停止本地服务？\n\n未应用的修改和标注会保留为草稿，下次打开预览时自动恢复。",
            modal_nothing_applied: "服务器上没有待应用的修改，本次没有写入任何文件。服务可能在这些修改之后重启过，请逐页检查修改和标注。",
            warn_draft_unsaved: "草稿未能写入磁盘。这次修改只暂存在内存里，点击“应用修改”前服务停止就会丢失。",
            notice_draft_restored: "已恢复 {count} 页未应用的草稿：{pages}。确认后点击“应用修改”。",
            warn_draft_conflict: "{pages} 在草稿保存后已在磁盘上变动，这部分草稿未恢复，已保留在 live_preview/{file}。",
            warn_draft_unreadable: "草稿文件无法读取，已保留为 live_preview/{file}。",
            modal_success_exit: "预览已停止。\n\n可以关闭本标签页并回到对话窗口。",
            modal_stopping: "正在停止预览服务……",
            lang_toggle_title: "切换语言",
            nav_first: "第一页 (Home)",
            nav_prev: "上一页 (←)",
            nav_next: "下一页 (→)",
            nav_last: "末页 (End)",
            nav_counter: "{current} / {total}",
            nav_empty: "— / —"
        },
        "zh-TW": {
            page_title: "VibeResume - 即時預覽",
            panel_slides: "投影片",
            panel_edit_annotate: "編輯 / 標註",
            placeholder_select_slide: "在左側選擇一張投影片開始",
            label_selected_element: "已選元素",
            empty_selected_element: "點選投影片中的元素進行選擇",
            btn_select_group: "選擇父群組",
            label_batch_edit: "批次編輯",
            label_group_edit: "群組編輯",
            section_geometry: "幾何",
            section_style: "樣式",
            section_text_style: "文字",
            section_raw_attrs: "原始屬性",
            label_edit_instruction: "修改說明",
            pending_none: "沒有待套用修改",
            pending_summary: "{edits} 筆直接修改、{annotations} 個頁面有 AI 標註待套用",
            pending_pages: "頁面：{pages}",
            quick_align: "對齊/移動",
            quick_resize: "調整大小",
            quick_replace_image: "換圖",
            quick_copy: "改文案",
            quick_relayout: "重排此區域",
            placeholder_annotation: "描述希望 AI 如何修改該元素……",
            placeholder_annotation_multi: "描述希望如何修改所選 {count} 個元素……",
            btn_add_annotation: "新增標註",
            label_annotations_on_slide: "本頁標註",
            btn_submit_annotations: "套用修改",
            btn_exit_preview: "結束預覽",
            modal_submit: "送出",
            modal_cancel: "取消",
            empty_waiting_slides: "正在等待生成投影片……",
            empty_no_slides: "未找到投影片",
            placeholder_live_ready: "即時預覽已就緒，生成的投影片會在這裡出現。",
            placeholder_slide_writing: "投影片仍在寫入，等待下次重新整理……",
            empty_annotations: "尚無標註",
            tooltip_remove_annotation: "刪除標註",
            multi_selected: "已選 {count} 個元素",
            multi_mixed: "混合",
            err_load_slides: "載入投影片失敗：",
            err_load_slide: "載入投影片失敗：",
            err_add_annotation: "新增標註失敗：",
            err_remove_annotation: "刪除標註失敗：",
            err_save: "儲存失敗：",
            err_exit: "無法停止預覽：",
            err_edit: "編輯失敗：",
            label_direct_edit: "物件屬性（點選套用修改後寫入）",
            prop_multiline_hint: "包含巢狀內容，請選擇具體文字元素，或標註整個區域讓 AI 修改",
            edit_saved_hint: "修改已暫存。點選「套用修改」後寫入 HTML。",
            btn_undo: "復原",
            undo_done: "已復原上一筆暫存修改",
            undo_empty: "沒有可復原的暫存修改",
            overlap_caption: "此處元素重疊——請點選其中一個",
            err_empty_svg: "投影片已載入但畫布為空。SVG 可能損壞或缺少根 <svg> 元素。",
            warn_icon_inline: "{count} 個圖示算繪失敗：{names}",
            warn_matrix_transform: "本次幾何修改會以 transform matrix 儲存。預覽結果準確；PDF 匯出則取決於轉換流程是否支援 matrix。",
            modal_matrix_transform_note: "\n\n提示：至少有一筆暫存幾何修改使用了 transform matrix。請使用目前版本的 PDF 匯出器重新匯出，以套用 matrix。",
            slide_error_tooltip: "該投影片解析失敗：",
            reload_banner: "這張投影片已在磁碟上更新，點此重新載入。",
            conflict_banner: "暫存修改後來源檔案發生變化。請結束預覽並重新啟動；衝突草稿會封存至 live_preview，以便對照還原。",
            modal_confirm_submit: "確認將暫存的直接修改和 AI 標註寫入磁碟？\n\n預覽服務會繼續執行。需要關閉時請點選結束預覽。",
            modal_success_submit: "修改已儲存到 HTML。\n\n預覽服務仍在執行。",
            modal_success_direct_only: "修改已儲存到 HTML。\n\n直接修改已經寫入 HTML 原始檔；需要更新 PDF 時，請回到對話視窗要求重新匯出。預覽服務仍在執行。",
            modal_success_annotations_only: "標註已儲存到 HTML。\n\n需要 AI 理解並執行這些標註時，請回到對話視窗要求套用標註。預覽服務仍在執行。",
            modal_success_mixed: "直接修改和標註已儲存到 HTML。\n\n請回到對話視窗先套用需要 AI 判斷的標註，確認後再重新匯出 PDF。預覽服務仍在執行。",
            modal_confirm_exit: "結束預覽並停止本機服務？\n\n未套用的修改和標註會保留為草稿，下次開啟預覽時自動恢復。",
            modal_nothing_applied: "伺服器上沒有待套用的修改，本次沒有寫入任何檔案。服務可能在這些修改之後重新啟動過，請逐頁檢查修改和標註。",
            warn_draft_unsaved: "草稿未能寫入磁碟。這次修改只暫存在記憶體中，點選「套用修改」前服務停止就會遺失。",
            notice_draft_restored: "已恢復 {count} 頁未套用的草稿：{pages}。確認後點選「套用修改」。",
            warn_draft_conflict: "{pages} 在草稿儲存後已在磁碟上變動，這部分草稿未恢復，已保留在 live_preview/{file}。",
            warn_draft_unreadable: "草稿檔案無法讀取，已保留為 live_preview/{file}。",
            modal_success_exit: "預覽已停止。\n\n可以關閉本分頁並回到對話視窗。",
            modal_stopping: "正在停止預覽服務……",
            lang_toggle_title: "切換語言",
            nav_first: "第一頁 (Home)",
            nav_prev: "上一頁 (←)",
            nav_next: "下一頁 (→)",
            nav_last: "末頁 (End)",
            nav_counter: "{current} / {total}",
            nav_empty: "— / —"
        }
    };

    var LANG = (function () {
        try {
            var stored = window.localStorage.getItem("vibe_resume_preview_lang");
            if (stored === "zh" || stored === "en" || stored === "ja" ||
                stored === "zh-TW") return stored;
        } catch (e) { /* ignore */ }
        var nav = (navigator.language || navigator.userLanguage || "en").toLowerCase();
        if (nav.indexOf("zh") === 0) {
            if (/\bhans\b/.test(nav)) return "zh";
            if (/\bhant\b/.test(nav) || /\b(tw|hk|mo)\b/.test(nav)) return "zh-TW";
            return "zh";
        }
        if (nav.indexOf("ja") === 0) return "ja";
        return "en";
    })();

    function t(key, params) {
        var dict = MESSAGES[LANG] || MESSAGES.en;
        var msg = dict[key];
        if (msg === undefined) msg = MESSAGES.en[key];
        if (msg === undefined) return key;
        if (params) {
            Object.keys(params).forEach(function (p) {
                msg = msg.replace("{" + p + "}", params[p]);
            });
        }
        return msg;
    }

    function applyI18n() {
        document.documentElement.setAttribute("lang", LANG === "zh" ? "zh-CN" : (LANG === "zh-TW" ? "zh-TW" : (LANG === "ja" ? "ja" : "en")));
        document.title = t("page_title");
        document.querySelectorAll("[data-i18n]").forEach(function (el) {
            el.textContent = t(el.getAttribute("data-i18n"));
        });
        document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
            el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
        });
        document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
            el.title = t(el.getAttribute("data-i18n-title"));
        });
        updateNavLabel();
    }

    var LANG_NAMES = { zh: "中文", en: "English", ja: "日本語", "zh-TW": "繁體中文" };

    function refreshLangUI(lang) {
        // Custom dropdown (OS-independent): button shows the CURRENT language.
        var cur = document.getElementById("lang-current");
        if (cur) cur.textContent = LANG_NAMES[lang] || lang;
        var btn = document.getElementById("btn-lang-toggle");
        if (btn) btn.title = t("lang_toggle_title");
        document.querySelectorAll("#lang-menu li").forEach(function (li) {
            var selected = li.getAttribute("data-lang") === lang;
            li.classList.toggle("selected", selected);
            li.setAttribute("aria-selected", selected ? "true" : "false");
        });
    }

    function setLang(lang) {
        if (lang !== "zh" && lang !== "en" && lang !== "ja" && lang !== "zh-TW") return;
        LANG = lang;
        try { window.localStorage.setItem("vibe_resume_preview_lang", lang); } catch (e) { /* ignore */ }
        applyI18n();
        refreshLangUI(lang);
        // Re-render dynamic regions so they pick up the new language
        var annotationDraft = annotationText.value;
        updateSelectionPanel();
        annotationText.value = annotationDraft;
        updateAnnotationList();
        updateUndoButton();
        updatePendingStatus();
        initAnnotationQuickActions();
        loadSlides();
    }

    // ---- DOM refs ---------------------------------------------------
    var slideListEl       = document.getElementById("slide-list");
    var svgPlaceholder    = document.getElementById("svg-placeholder");
    var svgContent        = document.getElementById("svg-content");
    var selectedElementEl = document.getElementById("selected-element");
    var annotationInput   = document.getElementById("annotation-input");
    var annotationQuickActions = document.getElementById("annotation-quick-actions");
    var annotationText    = document.getElementById("annotation-text");
    var btnAddAnnotation  = document.getElementById("btn-add-annotation");
    var annotationsEl     = document.getElementById("annotations");
    var btnUndo           = document.getElementById("btn-undo");
    var btnSave           = document.getElementById("btn-save");
    var btnExitPreview    = document.getElementById("btn-exit-preview");
    var modalOverlay      = document.getElementById("modal-overlay");
    var modalMessage      = document.getElementById("modal-message");
    var modalConfirm      = document.getElementById("modal-confirm");
    var modalCancel       = document.getElementById("modal-cancel");
    var elementPropsEl    = document.getElementById("element-props");
    var pendingStatusEl   = document.getElementById("pending-status");

    var navFirstBtn       = document.getElementById("nav-first");
    var navPrevBtn        = document.getElementById("nav-prev");
    var navNextBtn        = document.getElementById("nav-next");
    var navLastBtn        = document.getElementById("nav-last");
    var navCounterEl      = document.getElementById("nav-counter");
    var navNameEl         = document.getElementById("nav-name");

    // ---- State ------------------------------------------------------
    var currentSlide      = null;   // filename, e.g. "slide_01.svg"
    var waitingForSlide   = null;   // current slide is temporarily unreadable in live mode
    var slideNames        = [];     // ordered slide filenames for navigation
    var selectedElementIds = new Set(); // id attrs of selected HTML elements
    var slideAnnotations  = {};     // {element_id: annotation_text} for current slide
    var annotationsBySlide = {};   // annotation state for each slide
    var liveMode          = false;
    var slidePollTimer    = null;
    var pendingModalAction = "submit";
    var modalBusy = false;
    var slideMtimes       = {};     // {name: mtime} — last-seen mtime for each slide
    var reloadBannerEl    = null;   // singleton banner element shown when currentSlide mtime drifts
    var editStackCount    = {};     // {name: staged edit count} — mirrors backend PENDING_EDITS
    var savedHintShown    = false;  // show the "staged edit" hint once per session
    var matrixHintShown   = false;  // show transform-matrix export hint once per session
    var matrixEditSlides  = {};     // {name: true} when a staged edit wrote transform=matrix(...)
    var annotationsDirty  = false;  // unsaved annotations added/removed this session
    var annotationEditSlides = {};  // {name: true} when annotations changed this session
    var annotationDraftRevision = 0;
    var inFlightChanges = new Set();

    annotationText.addEventListener("input", function () { annotationDraftRevision++; });

    function pendingDirectEditCount() {
        return Object.keys(editStackCount).reduce(function (total, name) {
            return total + Math.max(0, editStackCount[name] || 0);
        }, 0);
    }

    function pendingDirectEditSlides() {
        return Object.keys(editStackCount).filter(function (name) {
            return (editStackCount[name] || 0) > 0;
        });
    }

    function pendingAnnotationSlides() {
        return Object.keys(annotationEditSlides).filter(function (name) {
            return !!annotationEditSlides[name];
        });
    }

    function pendingAnnotationChangeCount() {
        return pendingAnnotationSlides().length;
    }

    function pendingSlideNames() {
        var seen = {};
        pendingDirectEditSlides().concat(pendingAnnotationSlides()).forEach(function (name) {
            seen[name] = true;
        });
        return Object.keys(seen).sort();
    }

    function updatePendingStatus() {
        if (!pendingStatusEl) return;
        var edits = pendingDirectEditCount();
        var annotations = pendingAnnotationChangeCount();
        if (edits === 0 && annotations === 0) {
            pendingStatusEl.className = "pending-status empty";
            pendingStatusEl.textContent = t("pending_none");
            return;
        }
        var pages = pendingSlideNames();
        pendingStatusEl.className = "pending-status active";
        pendingStatusEl.innerHTML =
            '<div>' + escapeHtml(t("pending_summary", {
                edits: edits,
                annotations: annotations,
            })) + '</div>' +
            (pages.length ? '<div class="pending-pages">' + escapeHtml(t("pending_pages", {
                pages: pages.join(", "),
            })) + '</div>' : '');
    }

    function markAnnotationChanged(slide) {
        if (!slide) return;
        annotationEditSlides[slide] = true;
        annotationsDirty = true;
        updatePendingStatus();
    }

    function initAnnotationQuickActions() {
        if (!annotationQuickActions) return;
        var actions = [
            { key: "quick_align" },
            { key: "quick_resize" },
            { key: "quick_replace_image" },
            { key: "quick_copy" },
            { key: "quick_relayout" },
        ];
        annotationQuickActions.innerHTML = "";
        actions.forEach(function (action) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "annotation-quick-chip";
            btn.textContent = t(action.key);
            btn.addEventListener("click", function () {
                var previous = annotationText.value;
                var label = t(action.key);
                var prefix = (LANG === "zh" || LANG === "zh-TW" || LANG === "ja") ? label + "：" : label + ": ";
                if (!annotationText.value.trim()) {
                    annotationText.value = prefix;
                } else if (annotationText.value.indexOf(prefix) === -1) {
                    annotationText.value = prefix + annotationText.value;
                }
                if (annotationText.value !== previous) annotationDraftRevision++;
                annotationText.focus();
                annotationText.selectionStart = annotationText.selectionEnd = annotationText.value.length;
            });
            annotationQuickActions.appendChild(btn);
        });
    }

    // Staged edits stay unapplied until "Apply changes" (the server mirrors them
    // to live_preview/draft.json). Warn before the tab leaves so the user
    // remembers to apply (browsers show their own generic prompt).
    function hasUnsavedWork() {
        if (annotationsDirty) return true;
        return Object.keys(editStackCount).some(function (k) {
            return editStackCount[k] > 0;
        });
    }
    window.addEventListener("beforeunload", function (e) {
        if (!hasUnsavedWork()) return undefined;
        e.preventDefault();
        e.returnValue = "";
        return "";
    });

    function readSlideFromLocation() {
        try {
            var params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
            return params.get("slide");
        } catch (err) {
            return null;
        }
    }

    function rememberSlideInLocation(name) {
        if (!name) return;
        var params;
        try {
            params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        } catch (err) {
            params = new URLSearchParams();
        }
        params.set("slide", name);
        var url = window.location.pathname + window.location.search + "#" + params.toString();
        window.history.replaceState(null, "", url);
    }

    function currentSlideIndex() {
        if (!currentSlide) return -1;
        return slideNames.indexOf(currentSlide);
    }

    function gotoSlideIndex(idx) {
        if (idx < 0 || idx >= slideNames.length) return;
        var name = slideNames[idx];
        if (name === currentSlide) return;
        var item = slideListEl.querySelector('.slide-item[data-name="' + cssAttr(name) + '"]');
        selectSlide(name, item || undefined);
    }

    function cssAttr(value) {
        return String(value).replace(/"/g, '\\"');
    }

    function updateNavLabel() {
        if (!navCounterEl) return;
        var total = slideNames.length;
        if (total === 0 || !currentSlide) {
            navCounterEl.textContent = t("nav_empty");
            if (navNameEl) navNameEl.textContent = "";
        } else {
            var idx = currentSlideIndex();
            navCounterEl.textContent = t("nav_counter", { current: idx + 1, total: total });
            if (navNameEl) navNameEl.textContent = currentSlide;
        }
        var idx2 = currentSlideIndex();
        var hasCurrent = idx2 >= 0;
        if (navFirstBtn) navFirstBtn.disabled = !hasCurrent || idx2 === 0;
        if (navPrevBtn)  navPrevBtn.disabled  = !hasCurrent || idx2 <= 0;
        if (navNextBtn)  navNextBtn.disabled  = !hasCurrent || idx2 >= total - 1;
        if (navLastBtn)  navLastBtn.disabled  = !hasCurrent || idx2 >= total - 1;
    }

    // Keep data-i18n on the shown key so applyI18n() re-translates it instead of resetting it.
    function setPlaceholder(key) {
        svgPlaceholder.setAttribute("data-i18n", key);
        svgPlaceholder.textContent = t(key);
    }

    // ================================================================
    //  1.  loadSlides  -- GET /api/slides
    // ================================================================
    function loadSlides() {
        return fetch("/api/slides")
            .then(function (res) { return res.json(); })
            .then(function (data) {
                slideListEl.innerHTML = "";
                var slides = data.slides || [];
                slideNames = slides.map(function (s) { return s.name; });

                if (slides.length === 0) {
                    var empty = document.createElement("div");
                    empty.className = "slide-list-empty";
                    empty.textContent = liveMode
                        ? t("empty_waiting_slides")
                        : t("empty_no_slides");
                    slideListEl.appendChild(empty);
                    if (!currentSlide) {
                        svgPlaceholder.style.display = "block";
                        setPlaceholder(liveMode ? "placeholder_live_ready" : "empty_no_slides");
                        svgContent.style.display = "none";
                    }
                    updateNavLabel();
                    updatePendingStatus();
                    return;
                }

                var currentExists = false;
                var currentReady = false;
                var currentMtimeChanged = false;
                slides.forEach(function (s) {
                    if (s.name === currentSlide) {
                        currentExists = true;
                        currentReady = s.ok !== false;
                        // Compare against the mtime we recorded when we last rendered this slide.
                        var lastSeen = slideMtimes[s.name];
                        if (lastSeen !== undefined && s.mtime && s.mtime !== lastSeen) {
                            currentMtimeChanged = true;
                        }
                    }
                    // Track every slide's mtime for the next poll (only update non-current here;
                    // currentSlide's mtime is updated by selectSlide so we can detect drift).
                    if (s.name !== currentSlide && s.mtime !== undefined) {
                        slideMtimes[s.name] = s.mtime;
                    }

                    var item = document.createElement("div");
                    item.className = "slide-item" + (s.name === currentSlide ? " active" : "");
                    if (s.ok === false) {
                        item.className += " slide-error";
                        item.title = t("slide_error_tooltip") + (s.error || "");
                    }
                    item.setAttribute("data-name", s.name);

                    var nameSpan = document.createElement("span");
                    nameSpan.className = "slide-name";
                    nameSpan.textContent = s.name;
                    item.appendChild(nameSpan);

                    if (s.annotation_count > 0) {
                        var badge = document.createElement("span");
                        badge.className = "badge";
                        badge.textContent = s.annotation_count;
                        item.appendChild(badge);
                    }

                    item.addEventListener("click", function () {
                        selectSlide(s.name, item);
                    });
                    slideListEl.appendChild(item);
                });

                if (!currentSlide || !currentExists) {
                    var rememberedSlide = readSlideFromLocation();
                    var targetSlide = rememberedSlide && slideNames.indexOf(rememberedSlide) !== -1
                        ? rememberedSlide
                        : slides[0].name;
                    selectSlide(targetSlide);
                } else if (waitingForSlide === currentSlide) {
                    if (currentReady) {
                        selectSlide(currentSlide);
                    }
                } else if (currentMtimeChanged) {
                    if (!hasUnsavedWork()) selectSlide(currentSlide);
                    else showReloadBanner(currentSlide);
                }
                updateNavLabel();
                updatePendingStatus();
            })
            .catch(function (err) {
                console.error("loadSlides:", err);
                showError(t("err_load_slides") + err.message);
            });
    }

    // ================================================================
    //  2.  selectSlide  -- GET /api/slide/{name}
    // ================================================================
    function waitForSlideRewrite(name) {
        if (!liveMode || name !== currentSlide) return;
        waitingForSlide = name;
        svgPlaceholder.style.display = "block";
        setPlaceholder("placeholder_slide_writing");
        svgContent.style.display = "none";
    }

    // HTML canvas adapter; the surrounding shell is retained from VibeResume.
    var sourceDigest = null;
    var slideRequest = 0;
    var canvas = new ResumeCanvas(svgContent, {
        select: selectElement, clear: clearSelection, key: handleKey,
        elements: selectedTopLevel,
        move: function (element, value, old) {
            stageEditRequest(element.id, { styles: value }).then(updateSelectionPanel).catch(function (error) {
                if (old === null) element.removeAttribute("style"); else element.setAttribute("style", old); showError(error.message);
            });
        }
    });
    function canvasDocument() { return canvas.document(); }
    function selectedTopLevel() {
        var elements = Array.from(selectedElementIds).map(function (id) { return canvasDocument().getElementById(id); }).filter(Boolean);
        return elements.filter(function (element) { return !elements.some(function (parent) { return parent !== element && parent.contains(element); }); });
    }
    async function selectSlide(name, item) {
        var request = ++slideRequest;
        try {
            var data = await fetch('/api/slide/' + encodeURIComponent(name)).then(jsonOrThrow);
            if (request !== slideRequest) return;
            svgPlaceholder.style.display = 'none';
            svgContent.style.display = 'block';
            if (!await canvas.load(data.content, data.base_url, data.page_index) || request !== slideRequest) return;
            currentSlide = name;
            waitingForSlide = null;
            rememberSlideInLocation(name);
            clearSelection();
            sourceDigest = data.base_digest;
            slideAnnotations = annotationsBySlide[name] = {};
            hideReloadBanner();
            document.querySelectorAll('.slide-item').forEach(function (entry) { entry.classList.toggle('active', entry.dataset.name === name); });
            slideMtimes[name] = data.mtime;
            (data.annotations || []).forEach(function (annotation) { slideAnnotations[annotation.element_id] = annotation.annotation; });
            editStackCount[name] = data.undo_depth || 0;
            refreshAnnotationVisuals(); updateAnnotationList(); updateUndoButton(); updatePendingStatus(); updateNavLabel();
        } catch (error) {
            if (request !== slideRequest) return;
            if (error.status === 409) { showReloadBanner(currentSlide || name, true); return; }
            currentSlide = name;
            waitingForSlide = null;
            rememberSlideInLocation(name);
            clearSelection();
            slideAnnotations = annotationsBySlide[name] = {};
            hideReloadBanner();
            document.querySelectorAll('.slide-item').forEach(function (entry) { entry.classList.toggle('active', entry.dataset.name === name); });
            updateAnnotationList(); updateUndoButton(); updateNavLabel();
            showError(error.message); waitForSlideRewrite(name);
        }
    }
    function handleKey(event) {
        var target = event.target;
        if (target?.closest?.('input,textarea,select,[contenteditable=true]')) return;
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); runUndo(); return; }
        if (event.key === 'Escape') { clearSelection(); return; }
        if (selectedElementIds.size && /^Arrow/.test(event.key)) {
            event.preventDefault();
            var step = event.shiftKey ? 10 : 1;
            var dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
            var dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
            selectedTopLevel().forEach(function (element) {
                var value = canvas.translation(element);
                var next = canvas.moveStyles(element, value[0] + dx, value[1] + dy);
                var old = element.getAttribute('style');
                Object.entries(next).forEach(function (entry) { element.style.setProperty(entry[0], entry[1], 'important'); });
                canvas.callbacks.move(element, next, old);
            });
        } else if (event.key === 'ArrowLeft') gotoSlideIndex(currentSlideIndex() - 1);
        else if (event.key === 'ArrowRight') gotoSlideIndex(currentSlideIndex() + 1);
        else if (event.key === 'Home') gotoSlideIndex(0);
        else if (event.key === 'End') gotoSlideIndex(slideNames.length - 1);
    }
    function initKeyboardShortcuts() { document.addEventListener('keydown', handleKey); }
    function initSlideNav() {
        navFirstBtn.onclick = function () { gotoSlideIndex(0); };
        navPrevBtn.onclick = function () { gotoSlideIndex(currentSlideIndex() - 1); };
        navNextBtn.onclick = function () { gotoSlideIndex(currentSlideIndex() + 1); };
        navLastBtn.onclick = function () { gotoSlideIndex(slideNames.length - 1); };
    }
    function hasPendingMatrixEdits() { return false; }
    function payloadHasMatrixTransform() { return false; }

    function selectElement(elem, addToSelection) {
        var eid = elem.id;
        if (!eid) return;
        annotationDraftRevision++;

        if (addToSelection) {
            // Ctrl+click: toggle this element
            if (selectedElementIds.has(eid)) {
                selectedElementIds.delete(eid);
                elem.classList.remove("svg-selected");
            } else {
                selectedElementIds.add(eid);
                elem.classList.add("svg-selected");
            }
        } else {
            // Normal click: clear others, select only this one
            selectedElementIds.forEach(function (id) {
                if (id !== eid) {
                    var old = canvasDocument().querySelector("#" + CSS.escape(id));
                    if (old) old.classList.remove("svg-selected");
                }
            });
            selectedElementIds.clear();
            selectedElementIds.add(eid);
            elem.classList.add("svg-selected");
        }

        updateSelectionPanel();
    }

    // ================================================================
    //  5.  clearSelection
    // ================================================================
    function clearSelection() {
        annotationDraftRevision++;
        selectedElementIds.forEach(function (id) {
            var el = canvasDocument().querySelector("#" + CSS.escape(id));
            if (el) el.classList.remove("svg-selected");
        });
        selectedElementIds.clear();
        updateSelectionPanel();
    }

    function updateSelectionPanel() {
        var propsEl = elementPropsEl;
        var count = selectedElementIds.size;

        if (count === 0) {
            selectedElementEl.classList.add("empty");
            selectedElementEl.textContent = t("empty_selected_element");
            annotationInput.style.display = "none";
            annotationText.value = "";
            propsEl.style.display = "none";
            propsEl.innerHTML = "";
            return;
        }

        selectedElementEl.classList.remove("empty");
        propsEl.style.display = "block";

        if (count === 1) {
            var eid = selectedElementIds.values().next().value;
            var el = canvasDocument().querySelector("#" + CSS.escape(eid));
            if (el) {
                var tag = el.tagName.toLowerCase();
                selectedElementEl.innerHTML =
                    '<span class="el-tag">&lt;' + escapeHtml(tag) + '&gt;</span>' +
                    '<span class="el-id">' + escapeHtml(eid) + '</span>';
                propsEl.innerHTML = renderEditableProps(el);
                attachPropEditors(el);
            }
        } else {
            selectedElementEl.innerHTML =
                '<span class="multi-count">' + escapeHtml(t("multi_selected", { count: count })) + '</span>';
            propsEl.innerHTML = renderMultiSelectSummary(Array.from(selectedElementIds));
            attachMultiSelectionEditors(Array.from(selectedElementIds));
        }

        annotationInput.style.display = "block";
        annotationText.placeholder = count > 1
            ? t("placeholder_annotation_multi", { count: count })
            : t("placeholder_annotation");
        annotationText.value = count === 1
            ? (slideAnnotations[selectedElementIds.values().next().value] || "")
            : "";
    }

    btnAddAnnotation.addEventListener("click", function () {
        if (!currentSlide || selectedElementIds.size === 0) return;

        var draft = annotationText.value;
        var text = draft.trim();
        if (!text) return;

        var slide = currentSlide;
        var ids = Array.from(selectedElementIds);
        var revision = annotationDraftRevision;
        var promises = ids.map(function (eid) {
            return fetch("/api/slide/" + encodeURIComponent(slide) + "/annotate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ element_id: eid, annotation: text, base_digest: sourceDigest })
            }).then(jsonOrThrow);
        });

        var request = Promise.allSettled(promises)
            .then(function (results) {
                var failed = results.find(function (result) { return result.status === "rejected"; });
                if (failed) throw failed.reason;
            })
            .then(function () {
                ids.forEach(function (eid) {
                    annotationsBySlide[slide][eid] = text;
                });
                markAnnotationChanged(slide);
                if (slide === currentSlide) {
                    refreshAnnotationVisuals();
                    updateAnnotationList();
                    if (revision === annotationDraftRevision && annotationText.value === draft) {
                        annotationText.value = "";
                    }
                }
                loadSlides();
            });
        trackChange(request);
        request.catch(function (err) {
            console.error("addAnnotation:", err);
            showError(t("err_add_annotation") + err.message);
        });
    });

    // ================================================================
    //  7.  removeAnnotation  -- DELETE /api/slide/{name}/annotate/{id}
    // ================================================================
    function removeAnnotation(elementId) {
        if (!currentSlide) return;

        var slide = currentSlide;
        var request = fetch("/api/slide/" + encodeURIComponent(slide) + "/annotate/" + encodeURIComponent(elementId), {
            method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ base_digest: sourceDigest })
        })
            .then(jsonOrThrow)
            .then(function () {
                delete annotationsBySlide[slide][elementId];
                markAnnotationChanged(slide);
                if (slide === currentSlide) {
                    refreshAnnotationVisuals();
                    updateAnnotationList();
                }
                loadSlides();
            });
        trackChange(request);
        request.catch(function (err) {
            console.error("removeAnnotation:", err);
            showError(t("err_remove_annotation") + err.message);
        });
    }

    function trackChange(request) {
        inFlightChanges.add(request);
        var done = function () { inFlightChanges.delete(request); };
        request.then(done, done);
    }

    // ================================================================
    //  8.  refreshAnnotationVisuals
    // ================================================================
    function refreshAnnotationVisuals() {
        // Clear all annotated marks
        canvasDocument().querySelectorAll(".svg-annotated").forEach(function (el) {
            el.classList.remove("svg-annotated");
        });
        // Apply marks
        Object.keys(slideAnnotations).forEach(function (eid) {
            var el = canvasDocument().querySelector("#" + CSS.escape(eid));
            if (el) el.classList.add("svg-annotated");
        });
    }

    // ================================================================
    //  9.  updateAnnotationList
    // ================================================================
    function updateAnnotationList() {
        annotationsEl.innerHTML = "";

        var ids = Object.keys(slideAnnotations);
        if (ids.length === 0) {
            annotationsEl.innerHTML = '<div class="annotations-empty">' + escapeHtml(t("empty_annotations")) + '</div>';
            return;
        }

        ids.forEach(function (eid) {
            var item = document.createElement("div");
            item.className = "annotation-item";

            // Try to resolve tag from live HTML
            var tag = "";
            var el = canvasDocument().querySelector("#" + CSS.escape(eid));
            if (el) tag = el.tagName.toLowerCase();

            var header = document.createElement("div");
            header.className = "ann-header";

            var leftSpan = document.createElement("span");
            if (tag) {
                var tagSpan = document.createElement("span");
                tagSpan.className = "ann-tag";
                tagSpan.textContent = "<" + tag + ">";
                leftSpan.appendChild(tagSpan);
            }
            var idSpan = document.createElement("span");
            idSpan.className = "ann-id";
            idSpan.textContent = eid;
            leftSpan.appendChild(idSpan);

            header.appendChild(leftSpan);

            var removeBtn = document.createElement("button");
            removeBtn.className = "ann-remove";
            removeBtn.innerHTML = "&times;";
            removeBtn.title = t("tooltip_remove_annotation");
            removeBtn.addEventListener("click", function () {
                removeAnnotation(eid);
            });
            header.appendChild(removeBtn);

            item.appendChild(header);

            var textDiv = document.createElement("div");
            textDiv.className = "ann-text";
            textDiv.textContent = slideAnnotations[eid];
            item.appendChild(textDiv);

            annotationsEl.appendChild(item);
        });
    }

    // ================================================================
    // 10.  Save all  -- two-step: confirm then save
    // ================================================================
    btnSave.addEventListener("click", function () {
        pendingModalAction = "submit";
        modalMessage.textContent = t("modal_confirm_submit") +
            (hasPendingMatrixEdits() ? t("modal_matrix_transform_note") : "");
        modalConfirm.textContent = t("modal_submit");
        modalConfirm.style.display = "";
        modalCancel.style.display = "";
        modalOverlay.style.display = "flex";
    });

    btnExitPreview.addEventListener("click", function () {
        pendingModalAction = "exit";
        modalMessage.textContent = t("modal_confirm_exit");
        modalConfirm.textContent = t("btn_exit_preview");
        modalConfirm.style.display = "";
        modalCancel.style.display = "";
        modalOverlay.style.display = "flex";
    });

    function setModalBusy(busy) {
        modalBusy = busy;
        document.getElementById("app").inert = busy;
    }

    modalConfirm.addEventListener("click", function () {
        if (modalBusy) return;
        setModalBusy(true);
        if (pendingModalAction === "exit") {
            modalConfirm.style.display = "none";
            modalCancel.style.display = "none";
            modalMessage.textContent = t("modal_stopping");
            drainChanges()
                .then(function () {
                    return fetch("/api/shutdown", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ reason: "exit-preview" })
                    });
                })
                .then(jsonOrThrow)
                .then(function () {
                    modalMessage.textContent = t("modal_success_exit");
                })
                .catch(function (err) {
                    modalMessage.textContent = t("err_exit") + err.message;
                    modalConfirm.style.display = "";
                    modalCancel.style.display = "";
                })
                .finally(function () { setModalBusy(false); });
            return;
        }

        // Step 2: save annotations. Service lifetime is controlled only by Exit preview.
        var hadDirectEdits;
        var hadAnnotationChanges;
        modalConfirm.style.display = "none";
        modalCancel.style.display = "none";

        // Wait for just-fired edits and annotations before saving the draft.
        drainChanges()
            .then(function () {
                hadDirectEdits = pendingDirectEditCount() > 0;
                hadAnnotationChanges = pendingAnnotationChangeCount() > 0;
                return fetch("/api/save-all", { method: "POST" });
            })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.error) {
                    modalMessage.textContent = t("err_save") + data.error;
                } else {
                    var nothingApplied = (hadDirectEdits || hadAnnotationChanges) &&
                        !(data.files_modified || []).length;
                    if (nothingApplied) {
                        modalMessage.textContent = t("modal_nothing_applied");
                    } else if (hadDirectEdits && hadAnnotationChanges) {
                        modalMessage.textContent = t("modal_success_mixed");
                    } else if (hadDirectEdits) {
                        modalMessage.textContent = t("modal_success_direct_only");
                    } else if (hadAnnotationChanges) {
                        modalMessage.textContent = t("modal_success_annotations_only");
                    } else {
                        modalMessage.textContent = t("modal_success_submit");
                    }
                    editStackCount = {};
                    matrixEditSlides = {};
                    matrixHintShown = false;
                    savedHintShown = false;
                    annotationsDirty = false;
                    annotationEditSlides = {};
                    updateUndoButton();
                    updatePendingStatus();
                    var activeSlide = currentSlide;
                    return loadSlides().then(function () {
                        if (activeSlide) {
                            var item = slideListEl.querySelector('.slide-item[data-name="' + cssAttr(activeSlide) + '"]');
                            return selectSlide(activeSlide, item || undefined);
                        }
                    });
                }
            })
            .catch(function (err) {
                modalMessage.textContent = t("err_save") + err;
                modalConfirm.style.display = "";
                modalCancel.style.display = "";
            })
            .finally(function () { setModalBusy(false); });
    });

    modalCancel.addEventListener("click", function () {
        if (modalBusy) return;
        modalConfirm.textContent = t("modal_submit");
        modalOverlay.style.display = "none";
    });

    // Close modal on overlay click
    modalOverlay.addEventListener("click", function (e) {
            if (e.target === modalOverlay && !modalBusy) {
                modalConfirm.textContent = t("modal_submit");
                modalOverlay.style.display = "none";
            }
        });

    // ================================================================
    //  Utility
    // ================================================================
    function showError(msg) {
        var banner = document.createElement("div");
        banner.style.cssText = "position:fixed;top:0;left:0;right:0;padding:10px 16px;background:#ef4444;color:#fff;font-size:13px;text-align:center;z-index:999;cursor:pointer;";
        banner.textContent = msg;
        banner.onclick = function () { banner.remove(); };
        document.body.appendChild(banner);
        setTimeout(function () { banner.remove(); }, 5000);
    }

    function showWarning(msg) {
        // Amber, non-fatal counterpart to showError. Stacks below an existing
        // error banner because z-index is identical and DOM order wins.
        var banner = document.createElement("div");
        banner.style.cssText = "position:fixed;top:38px;left:0;right:0;padding:8px 16px;background:#f59e0b;color:#1f1300;font-size:12px;text-align:center;z-index:998;cursor:pointer;";
        banner.textContent = msg;
        banner.onclick = function () { banner.remove(); };
        document.body.appendChild(banner);
        setTimeout(function () { banner.remove(); }, 6000);
    }

    function showReloadBanner(name, conflict) {
        if (!conflict && reloadBannerEl && reloadBannerEl.dataset.conflict === "true") return;
        // Singleton: replace any prior banner so we never stack reloads.
        hideReloadBanner();
        var banner = document.createElement("div");
        banner.id = "reload-banner";
        banner.dataset.conflict = conflict ? "true" : "false";
        banner.style.cssText = "position:fixed;top:0;left:0;right:0;padding:10px 16px;background:" + (conflict ? "#dc2626" : "#2563eb") + ";color:#fff;font-size:13px;text-align:center;z-index:1000;cursor:pointer;";
        banner.textContent = t(conflict ? "conflict_banner" : "reload_banner");
        banner.onclick = function () {
            // Re-fetch via selectSlide so all post-load logic (annotation merge,
            // warnings, mtime update) runs the same way as a manual click.
            var item = slideListEl.querySelector('.slide-item[data-name="' + cssAttr(name) + '"]');
            selectSlide(name, item || undefined);
        };
        document.body.appendChild(banner);
        reloadBannerEl = banner;
    }

    function hideReloadBanner() {
        if (reloadBannerEl) {
            reloadBannerEl.remove();
            reloadBannerEl = null;
        }
    }

    function escapeHtml(str) {
        var d = document.createElement("div");
        d.appendChild(document.createTextNode(str));
        return d.innerHTML;
    }

    function escapeHtmlAttr(str) {
        return escapeHtml(str).replace(/"/g, "&quot;");
    }

    function jsonOrThrow(res) {
        return res.json().then(function (data) {
            if (!res.ok || data.error) {
                var error = new Error(data.error || ("Request failed with status " + res.status));
                error.status = res.status;
                throw error;
            }
            if (data.draft_saved === false) showWarning(t("warn_draft_unsaved"));
            return data;
        });
    }

    // Mirror the server's unapplied state (including a draft restored at
    // startup) into the pending-state trackers, so Apply changes, the pending
    // strip and the leave guard see it after a reload or server restart.
    function applyDraftStatus(draft) {
        if (!draft) return;
        var pending = draft.pending || {};
        Object.keys(pending).forEach(function (name) {
            if (pending[name].annotations) {
                annotationEditSlides[name] = true;
                annotationsDirty = true;
            }
            editStackCount[name] = pending[name].edits || 0;
        });
        updatePendingStatus();
        var startup = draft.startup;
        if (!startup) return;
        var names = Object.keys(startup.restored || {}).sort();
        var messages = [];
        if (names.length) {
            messages.push(t("notice_draft_restored", { count: names.length, pages: names.join(", ") }));
        }
        if (startup.unreadable && startup.conflict_file) {
            messages.push(t("warn_draft_unreadable", { file: startup.conflict_file }));
        } else if ((startup.conflicts || []).length && startup.conflict_file) {
            messages.push(t("warn_draft_conflict", {
                pages: startup.conflicts.join(", "),
                file: startup.conflict_file,
            }));
        }
        if (messages.length) showWarning(messages.join(" "));
    }

    function loadConfig() {
        return fetch("/api/config")
            .then(function (res) { return res.json(); })
            .then(function (data) {
                liveMode = !!data.live;
                applyDraftStatus(data.draft);
            })
            .catch(function () {
                liveMode = false;
            });
    }

    function startSlidePolling() {
        if (!liveMode || slidePollTimer) return;
        slidePollTimer = window.setInterval(function () {
            loadSlides();
        }, 2000);
    }

    // ---- Direct-edit undo + save hint --------------------------------
    function updateUndoButton() {
        if (!btnUndo) return;
        var n = (currentSlide && editStackCount[currentSlide]) || 0;
        btnUndo.disabled = n === 0;
        btnUndo.textContent = n > 0 ? (t("btn_undo") + " (" + n + ")") : t("btn_undo");
    }

    function runUndo() {
        if (modalBusy || !currentSlide || !editStackCount[currentSlide]) return;
        var slide = currentSlide;
        var request = fetch("/api/slide/" + encodeURIComponent(slide) + "/undo", { method: "POST" })
            .then(jsonOrThrow)
            .then(function (data) {
                editStackCount[slide] = data.undo_depth || 0;
                if (!editStackCount[slide]) matrixEditSlides[slide] = false;
                if (data.mtime !== undefined && data.mtime !== null) slideMtimes[slide] = data.mtime;
                updateUndoButton();
                updatePendingStatus();
                showWarning(t(data.status === "empty" ? "undo_empty" : "undo_done"));
                if (slide === currentSlide) {
                    var item = slideListEl.querySelector('.slide-item[data-name="' + cssAttr(slide) + '"]');
                    return selectSlide(slide, item || undefined);
                }
            });
        trackChange(request);
        request.catch(function (err) {
            showError(t("err_edit") + err.message);
        });
    }

    function maybeShowSavedHint() {
        if (savedHintShown) return;
        savedHintShown = true;
        showWarning(t("edit_saved_hint"));
    }

    function propertyInputs(elements) {
        var fields = ['color', 'background-color', 'font-family', 'font-size', 'font-weight', 'line-height', 'text-align', 'letter-spacing', 'width', 'height', 'opacity'];
        var html = '<div class="prop-caption">' + escapeHtml(t('label_direct_edit')) + '</div><table class="prop-table">';
        if (elements.length === 1 && !elements[0].children.length && elements[0].namespaceURI === 'http://www.w3.org/1999/xhtml' && !['img','br','hr','input','source','wbr'].includes(elements[0].localName)) {
            html += '<tr><td class="prop-key">' + escapeHtml(t('section_text_style')) + '</td><td><textarea class="prop-edit prop-edit-content">' + escapeHtml(elements[0].textContent) + '</textarea></td></tr>';
        } else if (elements.length === 1) {
            html += '<tr><td colspan="2">' + escapeHtml(t('prop_multiline_hint')) + '</td></tr>';
        }
        fields.forEach(function (key) {
            var values = elements.map(function (element) { return element.ownerDocument.defaultView.getComputedStyle(element).getPropertyValue(key); });
            var value = values.every(function (entry) { return entry === values[0]; }) ? values[0] : '';
            html += '<tr><td class="prop-key">' + key + '</td><td><input class="prop-edit" data-style="' + key + '" value="' + escapeHtmlAttr(value) + '"></td></tr>';
        });
        html += '</table>';
        if (elements.length === 1 && elements[0] !== canvas.page && elements[0].parentElement?.id) html += '<button class="btn-select-group" data-parent="' + escapeHtmlAttr(elements[0].parentElement.id) + '">' + escapeHtml(t('btn_select_group')) + '</button>';
        return html;
    }
    function renderEditableProps(element) { return propertyInputs([element]); }
    function renderMultiSelectSummary() { return propertyInputs(selectedTopLevel()); }
    function attachEditors(elements) {
        var text = elementPropsEl.querySelector('.prop-edit-content');
        if (text) text.onchange = function () {
            var element = elements[0];
            stageEditRequest(element.id, { text: text.value }).then(function () { element.textContent = text.value; canvas.fit(); }).catch(function (error) { showError(error.message); });
        };
        elementPropsEl.querySelectorAll('[data-style]').forEach(function (input) {
            input.onchange = function () {
                var key = input.dataset.style, value = input.value.trim();
                if (!value) return;
                if (!CSS.supports(key, value)) { showError(t('err_edit') + key); return; }
                var styles = {}; styles[key] = value;
                Promise.all(elements.map(function (element) { return stageEditRequest(element.id, { styles: styles }).then(function () { element.style.setProperty(key, value, 'important'); }); })).then(function () { canvas.fit(); }).catch(function (error) { showError(error.message); });
            };
        });
        var parent = elementPropsEl.querySelector('[data-parent]');
        if (parent) parent.onclick = function () { selectElement(canvasDocument().getElementById(parent.dataset.parent), false); };
    }
    function attachPropEditors(element) { attachEditors([element]); }
    function attachMultiSelectionEditors() { attachEditors(selectedTopLevel()); }

    function drainChanges() {
        if (inFlightChanges.size === 0) return Promise.resolve();
        return Promise.allSettled(Array.from(inFlightChanges)).then(function (results) {
            var failed = results.find(function (r) { return r.status === "rejected"; });
            if (failed) throw failed.reason;
            return drainChanges();
        });
    }

    function stageEditRequest(eid, payload, slideName) {
        // Pin the slide at call time: a queued nudge may fire after the user has
        // navigated, and must still POST to the slide it was made on, not the
        // global currentSlide.
        var slide = slideName || currentSlide;
        var body = { element_id: eid, base_digest: sourceDigest };
        if (payload.styles !== undefined) body.styles = payload.styles;
        if (payload.text !== undefined) body.text = payload.text;
        var p = fetch("/api/slide/" + encodeURIComponent(slide) + "/edit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        }).then(jsonOrThrow).then(function (data) {
            if (data && data.undo_depth !== undefined) {
                editStackCount[slide] = data.undo_depth;
                if (slide === currentSlide) updateUndoButton();
                updatePendingStatus();
            }
            if (payloadHasMatrixTransform(payload)) {
                markMatrixTransformEdit(slide);
            }
            maybeShowSavedHint();
            return data;
        });
        trackChange(p);
        return p;
    }

    // ================================================================
    //  Boot
    // ================================================================
    applyI18n();
    initAnnotationQuickActions();
    updatePendingStatus();
    var langToggleBtn = document.getElementById("btn-lang-toggle");
    var langMenu = document.getElementById("lang-menu");
    if (langToggleBtn && langMenu) {
        refreshLangUI(LANG);
        var setMenuOpen = function (open) {
            langMenu.hidden = !open;
            langToggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
            if (open) {
                var sel = langMenu.querySelector("li.selected") || langMenu.querySelector("li[data-lang]");
                if (sel) sel.focus();
            }
        };
        var chooseLang = function (v) {
            setMenuOpen(false);
            langToggleBtn.focus();
            if (v) setLang(v);
        };
        langToggleBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            setMenuOpen(langMenu.hidden);
        });
        langToggleBtn.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && !langMenu.hidden) {
                e.stopPropagation();
                setMenuOpen(false);
            } else if ((e.key === "ArrowDown" || e.key === "ArrowUp") && langMenu.hidden) {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen(true);
            }
        });
        langMenu.addEventListener("click", function (e) {
            e.stopPropagation();
            var li = e.target && e.target.closest ? e.target.closest("li[data-lang]") : null;
            if (li) chooseLang(li.getAttribute("data-lang"));
            else setMenuOpen(false);
        });
        langMenu.addEventListener("keydown", function (e) {
            e.stopPropagation();   // keep nudge / slide-nav shortcuts away while the menu is open
            var items = Array.prototype.slice.call(langMenu.querySelectorAll("li[data-lang]"));
            var idx = items.indexOf(document.activeElement);
            if (e.key === "Escape") {
                setMenuOpen(false);
                langToggleBtn.focus();
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                (items[idx + 1] || items[0]).focus();
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                (items[idx - 1] || items[items.length - 1]).focus();
            } else if (e.key === "Home") {
                e.preventDefault();
                items[0].focus();
            } else if (e.key === "End") {
                e.preventDefault();
                items[items.length - 1].focus();
            } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
            } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (idx >= 0) chooseLang(items[idx].getAttribute("data-lang"));
            }
        });
        langToggleBtn.parentElement.addEventListener("focusout", function (e) {
            if (!langMenu.hidden && !langToggleBtn.parentElement.contains(e.relatedTarget)) setMenuOpen(false);
        });
        document.addEventListener("click", function () {
            if (!langMenu.hidden) setMenuOpen(false);
        });
    }

    loadConfig().then(function () {
        loadSlides();
        startSlidePolling();
    });
    initKeyboardShortcuts();
    initSlideNav();
    if (btnUndo) btnUndo.addEventListener("click", runUndo);
})();
