<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Chaînes de langue françaises pour Local Group Import.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['addemails'] = 'Ajouter les emails';
$string['addemailstogroup'] = 'Ajouter des étudiants par email';
$string['addgroups'] = 'Ajouter les groupes';
$string['addgroupstogrouping'] = 'Ajouter des groupes dans ce groupement';
$string['ajaxactionfailed'] = 'L’action demandée n’a pas pu être effectuée.';
$string['allgroups'] = 'Tous les groupes';
$string['alloweduserfields'] = 'Champs utilisables pour identifier les utilisateurs';
$string['alloweduserfields_desc'] = 'Sélectionnez les champs pouvant être utilisés pour identifier les apprenants dans les fichiers CSV (username, email, idnumber ou champs de profil personnalisés).';
$string['allroles'] = 'Tous les rôles';
$string['backtocourse'] = 'Retour au cours';
$string['clipboardtools'] = 'Outils de presse-papiers';
$string['clipboardtools_desc'] = 'Collez des adresses email pour vérifier celles qui correspondent aux participants inscrits au cours. Les adresses non reconnues sont affichées en rouge.';
$string['compactparticipants'] = 'Liste compacte';
$string['contextaddemails'] = 'Ajouter des emails dans ce groupe';
$string['contextaddgroups'] = 'Ajouter des groupes dans ce groupement';
$string['contextclearselection'] = 'Effacer la sélection';
$string['contextcopyemail'] = 'Copier l\'email';
$string['contextcopyfield'] = 'Copier {$a}';
$string['contextcopygroupingname'] = 'Copier le nom du groupement';
$string['contextcopygroupname'] = 'Copier le nom du groupe';
$string['contextcopymembername'] = 'Copier le nom de l\'étudiant';
$string['contextcopyselectedemails'] = 'Copier les emails sélectionnés';
$string['contextfocusrename'] = 'Renommer ce groupe';
$string['contextfocusrenamegrouping'] = 'Renommer ce groupement';
$string['contextremovemember'] = 'Retirer du groupe';
$string['creategroup'] = 'Créer un groupe';
$string['creategrouping'] = 'Créer un groupement';
$string['deletemembersselection'] = 'Retirer les membres sélectionnés';
$string['deletegroupingsselection'] = 'Supprimer les groupements sélectionnés';
$string['deletegroupsselection'] = 'Supprimer les groupes sélectionnés';
$string['deleteconfirmationtitle'] = 'Confirmer la suppression';
$string['detailcity'] = 'Ville';
$string['detailcountry'] = 'Pays';
$string['detaildepartment'] = 'Département';
$string['detailidnumber'] = 'Numéro d’identification';
$string['detailinstitution'] = 'Établissement';
$string['detaillanguage'] = 'Langue';
$string['detailusername'] = 'Nom d’utilisateur';
$string['draghintparticipant'] = 'Glisser ou copier';
$string['csvempty'] = 'Le fichier CSV est vide.';
$string['csvemptyfiledetail'] = 'Fichier vide';
$string['csvimportlink'] = 'Import CSV';
$string['csvinvalidrowmissing'] = 'Ligne invalide : identifiant utilisateur ou nom du groupe manquant.';
$string['csvloaderror'] = 'Erreur lors de la lecture du fichier CSV : {$a}.';
$string['csvmissingcolumns'] = 'Le CSV ne contient pas toutes les colonnes requises : useridentifier, groupname (et éventuellement groupingname).';
$string['defaultuserfield'] = 'Champ d’identification par défaut';
$string['defaultuserfield_desc'] = 'Ce champ sera présélectionné dans le formulaire d’import. Il doit faire partie des champs autorisés définis ci-dessus.';
$string['downloadtemplate'] = 'Télécharger le modèle CSV';
$string['easystudlabel'] = 'EasyStud';
$string['easystudmanager'] = 'Gestion simplifiée des étudiants';
$string['easystudmanager_desc'] = 'Gérez les participants inscrits au cours, les groupes et les groupements depuis une seule vue interactive. Les enseignants peuvent organiser les utilisateurs existants du cours sans inscrire de nouveaux utilisateurs.';
$string['emailsprocessed'] = '{} correspondances email traitées.';
$string['errorheader'] = 'Lignes en erreur';
$string['groupcreated'] = 'Groupe créé.';
$string['groupcreatefailed'] = 'Impossible de créer le groupe \'{$a->groupname}\' pour l\'utilisateur \'{$a->identifier}\'.';
$string['groupimport'] = 'Import de groupes (CSV)';
$string['groupingcreated'] = 'Groupement créé.';
$string['groupingcreatefailed'] = 'Impossible de créer le groupement \'{$a->groupingname}\' pour le groupe \'{$a->groupname}\'.';
$string['groupingsaved'] = 'Groupement enregistré.';
$string['groupingsdeleted'] = '{} groupements supprimés.';
$string['groupsprocessed'] = '{} groupes reconnus et déplacés.';
$string['groupmovedtogrouping'] = 'Groupe déplacé dans le groupement « {$a} ».';
$string['groupremovedfromgroupings'] = 'Groupe retiré des groupements.';
$string['groupsaved'] = 'Groupe enregistré.';
$string['groupsdeleted'] = '{} groupes supprimés.';
$string['groupscount'] = '{$a} groupe(s)';
$string['groupslabel'] = 'Groupes';
$string['groupstructure'] = 'Groupements, groupes et étudiants';
$string['groupstructuresummary'] = '{$a->groupings} groupement(s), {$a->groups} groupe(s)';
$string['groupswithoutgrouping'] = 'Groupes sans groupement';
$string['confirmdeletegroups'] = 'Certains groupes sélectionnés contiennent encore des étudiants. Confirmer la suppression ?';
$string['confirmdeletegroupings'] = 'Certains groupements sélectionnés contiennent encore des groupes. Confirmer la suppression ?';
$string['importfile'] = 'Fichier d’import (CSV)';
$string['importfile_help'] = 'Importez un fichier CSV avec les colonnes : useridentifier;groupname;groupingname (groupingname est optionnel). Le séparateur peut être ";" ou ",". La colonne "useridentifier" est interprétée selon le champ d’identification choisi dans le formulaire (username, email, idnumber ou champ de profil personnalisé).';
$string['importresults'] = 'Résultats de l’import';
$string['importsummary'] = 'Résumé de l’import';
$string['memberscount'] = '{$a} membre(s)';
$string['membersremoved'] = '{} membres retirés de leurs groupes.';
$string['nativeparticipants'] = 'Vue Participants native';
$string['newgroupingplaceholder'] = 'Nom du nouveau groupement';
$string['newgroupplaceholder'] = 'Nom du nouveau groupe';
$string['nogroup'] = 'Aucun groupe';
$string['nogroupmembers'] = 'Aucun étudiant dans ce groupe pour le moment.';
$string['nogroupstructurestate'] = 'Aucun groupe ou groupement n’est encore disponible dans ce cours.';
$string['noresults'] = 'Aucun résultat à afficher pour le moment. Téléversez un fichier CSV pour lancer l’import.';
$string['noparticipantsstate'] = 'Aucun participant inscrit n’est disponible pour la vue actuelle.';
$string['norole'] = 'Aucun rôle';
$string['participants'] = 'Participants';
$string['participantscount'] = '{$a} participant(s)';
$string['participantdetails'] = 'Détails du participant';
$string['opennativeprofile'] = 'Ouvrir le profil Moodle natif';
$string['pasteemailsplaceholder'] = 'Exemple d’email : nom@exemple.com';
$string['pastegroupsplaceholder'] = 'Collez ici des noms de groupes ou des identifiants de groupe...';
$string['pluginname'] = 'Import de groupes (CSV)';
$string['privacy:metadata'] = 'Le plugin Local Group Import ne stocke aucune donnée personnelle. Il traite uniquement des informations d’inscription existantes au cours.';
$string['removeuserfromgroup'] = 'Retirer {} de ce groupe';
$string['removegroupfromgrouping'] = 'Retirer ce groupe du groupement';
$string['removefromcoursefuture'] = 'Retrait futur du cours';
$string['rename'] = 'Renommer';
$string['roleslabel'] = 'Rôles';
$string['searchparticipants'] = 'Rechercher nom, email, rôle ou groupe';
$string['showless'] = 'moins';
$string['confirm'] = 'Confirmer';
$string['submitimport'] = 'Lancer l’import';
$string['successheader'] = 'Lignes traitées avec succès';
$string['templatename'] = 'modele_import_groupes.csv';
$string['tour_groupimport_coursehome_desc'] = 'Sur la page d’accueil du cours, indique où trouver l’entrée d’import de groupes.';
$string['tour_groupimport_coursehome_name'] = 'Astuce : trouver l’import de groupes dans le menu Plus';
$string['tour_groupimport_coursehome_step1_content'] = 'Dans la navigation en haut du cours, ouvrez le menu « Plus ». Vous y trouverez l’entrée « Import de groupes » pour accéder à l’outil.';
$string['tour_groupimport_coursehome_step1_title'] = 'Où trouver l’import de groupes ?';
$string['tour_groupimport_step1_content'] = 'Cette page vous permet de créer des groupes et d’y inscrire des étudiants à partir d’un fichier CSV. Les utilisateurs inexistants ou non inscrits au cours ne seront pas ajoutés, et l’import continue même en cas d’erreurs.';
$string['tour_groupimport_step1_title'] = 'Importer des groupes depuis un CSV';
$string['tour_groupimport_step2_content'] = 'Commencez par télécharger le modèle afin de respecter les colonnes attendues (useridentifier, groupname et éventuellement groupingname).';
$string['tour_groupimport_step2_title'] = 'Télécharger le modèle CSV';
$string['tour_groupimport_step3_content'] = 'Sélectionnez ensuite votre fichier CSV. Les séparateurs ";" et "," sont acceptés.';
$string['tour_groupimport_step3_title'] = 'Téléverser votre fichier CSV';
$string['tour_groupimport_step4_content'] = 'Choisissez comment identifier les utilisateurs (username, email, idnumber ou champ de profil personnalisé).';
$string['tour_groupimport_step4_title'] = 'Choisir le champ d’identification';
$string['tour_groupimport_step5_content'] = 'Cliquez sur le bouton pour démarrer l’import. Les inscriptions réussies et les erreurs seront listées dans le compte-rendu.';
$string['tour_groupimport_step5_title'] = 'Lancer l’import';
$string['tour_groupimport_step6_content'] = 'Le compte-rendu détaille les inscriptions effectuées et les erreurs (utilisateur introuvable, non inscrit au cours, déjà membre du groupe, etc.).';
$string['tour_groupimport_step6_title'] = 'Lire le compte-rendu';
$string['tour_groupimport_teacher_desc'] = 'Visite guidée pour importer des groupes et des inscriptions depuis un fichier CSV, avec contrôle d’existence des utilisateurs et d’inscription au cours.';
$string['tour_groupimport_teacher_name'] = 'Guide : Import de groupes (enseignants)';
$string['useraddedtogroup'] = 'L\'utilisateur \'{$a->identifier}\' a été ajouté au groupe \'{$a->groupname}\'.';
$string['useraddedtogroupwithgrouping'] = 'L\'utilisateur \'{$a->identifier}\' a été ajouté au groupe \'{$a->groupname}\' (groupement \'{$a->groupingname}\').';
$string['useralreadyingroup'] = 'L\'utilisateur \'{$a->identifier}\' est déjà membre du groupe \'{$a->groupname}\'.';
$string['userfield'] = 'Champ d’identification des utilisateurs';
$string['userfield_help'] = 'Cette option précise comment interpréter la colonne "useridentifier" du fichier CSV : par exemple comme un username, une adresse email, un idnumber, ou la valeur d’un champ de profil personnalisé.';
$string['usermultiplematches'] = 'Plusieurs utilisateurs correspondent à \'{$a->identifier}\' pour le champ \'{$a->field}\'.';
$string['usernotenrolled'] = 'L\'utilisateur \'{$a}\' n\'est pas inscrit à ce cours.';
$string['usernotfound'] = 'Utilisateur \'{$a}\' introuvable.';
$string['userremovedfromgroup'] = 'Utilisateur retiré du groupe.';
$string['usersaddedtogroup'] = '{} utilisateurs ajoutés au groupe.';
$string['viewparticipantdetails'] = 'Voir les détails';
